import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { MongoClient, ObjectId } from "mongodb";

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

async function sendOTPEmail(email: string, otp: string, fullName: string): Promise<boolean> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const { error } = await resend.emails.send({
      from: "BG Remover Portal <onboarding@resend.dev>",
      to: email,
      subject: "Your Login Code - BG Remover Portal",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: white; border-radius: 8px;">
          <h1 style="color: #18181b;">Login Code</h1>
          <p>Hello ${fullName},</p>
          <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</span>
          </div>
          <p style="color: #71717a; font-size: 14px;">This code expires in 10 minutes.</p>
        </div>
      `,
    });
    return !error;
  } catch {
    return false;
  }
}

async function sendEditedImageNotification(email: string, fullName: string, originalFileName: string): Promise<boolean> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    const { error } = await resend.emails.send({
      from: "BG Remover Portal <onboarding@resend.dev>",
      to: email,
      subject: "Your Image is Ready! - BG Remover Portal",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: white; border-radius: 8px;">
          <h1 style="color: #18181b;">Your Image is Ready!</h1>
          <p>Hello ${fullName},</p>
          <p>Great news! The background has been removed from your image: <strong>${originalFileName}</strong></p>
          <p>Log in to your account to download the edited image.</p>
        </div>
      `,
    });
    return !error;
  } catch {
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
