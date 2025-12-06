import { getDatabase } from "@shared/schema";

export async function initializeDatabase() {
  const db = await getDatabase();
  
  console.log("📦 Initializing MongoDB collections and indexes...");

  const usersCollection = db.collection('users');
  await usersCollection.createIndex({ email: 1 }, { unique: true });
  console.log("✅ Created unique index on users.email");

  const otpSessionsCollection = db.collection('otp_sessions');
  await otpSessionsCollection.createIndex({ email: 1 }, { unique: true });
  await otpSessionsCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  console.log("✅ Created indexes on otp_sessions (email unique, TTL on expiresAt)");

  const imageRequestsCollection = db.collection('image_requests');
  await imageRequestsCollection.createIndex({ userId: 1 });
  await imageRequestsCollection.createIndex({ status: 1 });
  await imageRequestsCollection.createIndex({ uploadedAt: -1 });
  console.log("✅ Created indexes on image_requests (userId, status, uploadedAt)");

  console.log("📦 Database initialization complete!");
}
