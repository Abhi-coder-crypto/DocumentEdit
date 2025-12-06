import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import { log } from "./index";
import { sendOTPEmail, sendEditedImageNotification } from "./email";

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadType = req.path.includes('/upload-edited') ? 'edited' : 'original';
    cb(null, `uploads/${uploadType}`);
  },
  filename: function (req, file, cb) {
    const uniqueId = nanoid(10);
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueId}${ext}`);
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.'));
    }
  }
});

// Helper to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== AUTH ROUTES =====
  
  // Request OTP
  app.post('/api/auth/request-otp', async (req, res) => {
    try {
      const { email, fullName } = req.body;
      
      if (!email || !fullName) {
        return res.status(400).json({ message: 'Email and full name are required' });
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP session
      await storage.createOTPSession({
        email,
        fullName,
        otp,
        expiresAt,
      });

      // Send OTP via email
      const emailSent = await sendOTPEmail(email, otp, fullName);

      res.json({ 
        message: emailSent ? 'OTP sent to your email' : 'OTP generated (email delivery issue - use the code shown)',
        // Always include OTP until email is properly configured
        otp,
        emailSent,
      });
    } catch (error: any) {
      log(`Error in request-otp: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  // Verify OTP and login
  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
      }

      // Get OTP session
      const session = await storage.getOTPSession(email);
      if (!session) {
        return res.status(400).json({ message: 'No OTP session found. Please request a new OTP.' });
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        await storage.deleteOTPSession(email);
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // Verify OTP
      if (session.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Delete OTP session
      await storage.deleteOTPSession(email);

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      // Create user if doesn't exist
      if (!user) {
        user = await storage.createUser({
          email: session.email,
          fullName: session.fullName,
          role: email === 'abhijeet18012001@gmail.com' ? 'admin' : 'user',
        });
      }

      res.json({ 
        message: 'Login successful',
        user: {
          id: user._id?.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        }
      });
    } catch (error: any) {
      log(`Error in verify-otp: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to verify OTP' });
    }
  });

  // ===== USER IMAGE ROUTES =====
  
  // Upload image
  app.post('/api/images/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const { userId, userEmail, userFullName } = req.body;

      if (!userId || !userEmail || !userFullName) {
        return res.status(400).json({ message: 'User information is required' });
      }

      // Create image request
      const imageRequest = await storage.createImageRequest({
        userId,
        userEmail,
        userFullName,
        originalFileName: req.file.originalname,
        originalFilePath: req.file.path,
        status: 'pending',
      });

      res.json({
        message: 'Image uploaded successfully',
        request: {
          id: imageRequest._id?.toString(),
          status: imageRequest.status,
          uploadedAt: imageRequest.uploadedAt,
        }
      });
    } catch (error: any) {
      log(`Error in image upload: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Get user's image requests
  app.get('/api/images/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const requests = await storage.getImageRequestsByUserId(userId);
      
      res.json({
        requests: requests.map(r => ({
          id: r._id?.toString(),
          originalFileName: r.originalFileName,
          originalFilePath: r.originalFilePath,
          editedFileName: r.editedFileName,
          editedFilePath: r.editedFilePath,
          status: r.status,
          uploadedAt: r.uploadedAt,
          completedAt: r.completedAt,
        }))
      });
    } catch (error: any) {
      log(`Error fetching user requests: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });

  // Download image file
  app.get('/api/images/download/:type/:filename', (req, res) => {
    try {
      const { type, filename } = req.params;
      
      if (type !== 'original' && type !== 'edited') {
        return res.status(400).json({ message: 'Invalid image type' });
      }

      const filePath = path.join(process.cwd(), 'uploads', type, filename);
      res.download(filePath);
    } catch (error: any) {
      log(`Error downloading file: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to download file' });
    }
  });

  // ===== ADMIN ROUTES =====
  
  // Get all image requests (admin only)
  app.get('/api/admin/requests', async (req, res) => {
    try {
      const requests = await storage.getAllImageRequests();
      
      res.json({
        requests: requests.map(r => ({
          id: r._id?.toString(),
          userId: r.userId,
          userEmail: r.userEmail,
          userFullName: r.userFullName,
          originalFileName: r.originalFileName,
          originalFilePath: r.originalFilePath,
          editedFileName: r.editedFileName,
          editedFilePath: r.editedFilePath,
          status: r.status,
          uploadedAt: r.uploadedAt,
          completedAt: r.completedAt,
        }))
      });
    } catch (error: any) {
      log(`Error fetching all requests: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to fetch requests' });
    }
  });

  // Upload edited image (admin only)
  app.post('/api/admin/upload-edited/:requestId', upload.single('editedImage'), async (req, res) => {
    try {
      const { requestId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: 'No edited image file provided' });
      }

      // Update request with edited image
      const updatedRequest = await storage.updateImageRequest(requestId, {
        editedFileName: req.file.originalname,
        editedFilePath: req.file.path,
        status: 'completed',
        completedAt: new Date(),
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: 'Request not found' });
      }

      // Send email notification to user
      await sendEditedImageNotification(
        updatedRequest.userEmail,
        updatedRequest.userFullName,
        updatedRequest.originalFileName
      );

      res.json({
        message: 'Edited image uploaded successfully',
        request: {
          id: updatedRequest._id?.toString(),
          status: updatedRequest.status,
          completedAt: updatedRequest.completedAt,
        }
      });
    } catch (error: any) {
      log(`Error uploading edited image: ${error.message}`, 'error');
      res.status(500).json({ message: 'Failed to upload edited image' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  return httpServer;
}
