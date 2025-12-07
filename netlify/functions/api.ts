import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { MongoClient, ObjectId } from "mongodb";
import nodemailer from "nodemailer";

const APP_NAME = "Cipla Healthcare Portal";

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not configured");
  
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient;
}

async function getDb() {
  const client = await getClient();
  return client.db();
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Email service not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your Netlify environment variables.");
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendOTPEmail(email: string, otp: string, fullName: string): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `${APP_NAME} <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your Login Code - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Login Code</h1>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;">Hello ${fullName},</p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #18181b;">${otp}</span>
            </div>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;">This code expires in 10 minutes.</p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">If you did not request this code, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw err;
  }
}

async function sendEditedImageNotification(email: string, fullName: string, originalFileName: string): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `${APP_NAME} <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your Image is Ready! - ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Your Image is Ready!</h1>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;">Hello ${fullName},</p>
            <p style="color: #3f3f46; font-size: 14px; margin: 0 0 16px 0;">
              Great news! The background has been removed from your image:
            </p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <span style="font-size: 14px; color: #18181b; font-weight: 500;">${originalFileName}</span>
            </div>
            <p style="color: #3f3f46; font-size: 14px; margin: 0 0 24px 0;">
              Log in to your account to download the edited image.
            </p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Thank you for using ${APP_NAME}!</p>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log(`Notification email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("Error sending notification email:", err);
    return false;
  }
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const path = event.path.replace("/.netlify/functions/api", "").replace("/api", "");
  const method = event.httpMethod;
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const db = await getDb();

    // POST /auth/request-otp
    if (path === "/auth/request-otp" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { email, fullName } = body;

      if (!email || !fullName) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: "Email and full name are required" }) };
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.collection("otp_sessions").updateOne(
        { email },
        { $set: { email, fullName, otp, expiresAt } },
        { upsert: true }
      );

      await sendOTPEmail(email, otp, fullName);

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ message: "OTP sent successfully" }) 
      };
    }

    // POST /auth/verify-otp
    if (path === "/auth/verify-otp" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { email, otp } = body;

      if (!email || !otp) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: "Email and OTP are required" }) };
      }

      const session = await db.collection("otp_sessions").findOne({ email });
      if (!session) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: "No OTP session found" }) };
      }

      if (new Date() > session.expiresAt) {
        await db.collection("otp_sessions").deleteOne({ email });
        return { statusCode: 400, headers, body: JSON.stringify({ message: "OTP has expired" }) };
      }

      if (session.otp !== otp) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: "Invalid OTP" }) };
      }

      await db.collection("otp_sessions").deleteOne({ email });

      let user = await db.collection("users").findOne({ email });
      
      if (!user) {
        const result = await db.collection("users").insertOne({
          email: session.email,
          fullName: session.fullName,
          role: email === "abhijeet18012001@gmail.com" ? "admin" : "user",
          createdAt: new Date(),
        });
        user = { _id: result.insertedId, email: session.email, fullName: session.fullName, role: email === "abhijeet18012001@gmail.com" ? "admin" : "user" };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Login successful",
          user: {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        }),
      };
    }

    // GET /images/user/:userId
    if (path.startsWith("/images/user/") && method === "GET") {
      const userId = path.replace("/images/user/", "");
      const requests = await db.collection("image_requests").find({ userId }).sort({ uploadedAt: -1 }).toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          requests: requests.map((r) => ({
            id: r._id.toString(),
            originalFileName: r.originalFileName,
            originalFilePath: r.originalFilePath,
            editedFileName: r.editedFileName,
            editedFilePath: r.editedFilePath,
            status: r.status,
            uploadedAt: r.uploadedAt,
            completedAt: r.completedAt,
          })),
        }),
      };
    }

    // GET /admin/requests
    if (path === "/admin/requests" && method === "GET") {
      const requests = await db.collection("image_requests").find({}).sort({ uploadedAt: -1 }).toArray();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          requests: requests.map((r) => ({
            id: r._id.toString(),
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
          })),
        }),
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ message: "Not found" }) };
  } catch (error: any) {
    console.error("API Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ message: error.message || "Internal server error" }) };
  }
};

export { handler };
