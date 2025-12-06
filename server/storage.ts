import { type User, type OTPSession, type ImageRequest, getDatabase } from "@shared/schema";
import { ObjectId } from "mongodb";

export interface IStorage {
  // User operations
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, '_id' | 'createdAt'>): Promise<User>;
  
  // OTP operations
  createOTPSession(session: Omit<OTPSession, '_id' | 'createdAt'>): Promise<OTPSession>;
  getOTPSession(email: string): Promise<OTPSession | null>;
  deleteOTPSession(email: string): Promise<void>;
  
  // Image request operations
  createImageRequest(request: Omit<ImageRequest, '_id' | 'uploadedAt'>): Promise<ImageRequest>;
  getImageRequestsByUserId(userId: string): Promise<ImageRequest[]>;
  getAllImageRequests(): Promise<ImageRequest[]>;
  updateImageRequest(id: string, update: Partial<ImageRequest>): Promise<ImageRequest | null>;
}

export class MongoStorage implements IStorage {
  // User operations
  async getUserByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });
    return user;
  }

  async createUser(user: Omit<User, '_id' | 'createdAt'>): Promise<User> {
    const db = await getDatabase();
    const newUser: User = {
      ...user,
      createdAt: new Date(),
    };
    const result = await db.collection<User>('users').insertOne(newUser as any);
    return { ...newUser, _id: result.insertedId };
  }

  // OTP operations
  async createOTPSession(session: Omit<OTPSession, '_id' | 'createdAt'>): Promise<OTPSession> {
    const db = await getDatabase();
    // Delete any existing sessions for this email
    await db.collection('otp_sessions').deleteMany({ email: session.email });
    
    const newSession: OTPSession = {
      ...session,
      createdAt: new Date(),
    };
    const result = await db.collection<OTPSession>('otp_sessions').insertOne(newSession as any);
    return { ...newSession, _id: result.insertedId };
  }

  async getOTPSession(email: string): Promise<OTPSession | null> {
    const db = await getDatabase();
    const session = await db.collection<OTPSession>('otp_sessions').findOne({ email });
    return session;
  }

  async deleteOTPSession(email: string): Promise<void> {
    const db = await getDatabase();
    await db.collection('otp_sessions').deleteMany({ email });
  }

  // Image request operations
  async createImageRequest(request: Omit<ImageRequest, '_id' | 'uploadedAt'>): Promise<ImageRequest> {
    const db = await getDatabase();
    const newRequest: ImageRequest = {
      ...request,
      uploadedAt: new Date(),
    };
    const result = await db.collection<ImageRequest>('image_requests').insertOne(newRequest as any);
    return { ...newRequest, _id: result.insertedId };
  }

  async getImageRequestsByUserId(userId: string): Promise<ImageRequest[]> {
    const db = await getDatabase();
    const requests = await db.collection<ImageRequest>('image_requests')
      .find({ userId })
      .sort({ uploadedAt: -1 })
      .toArray();
    return requests;
  }

  async getAllImageRequests(): Promise<ImageRequest[]> {
    const db = await getDatabase();
    const requests = await db.collection<ImageRequest>('image_requests')
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray();
    return requests;
  }

  async updateImageRequest(id: string, update: Partial<ImageRequest>): Promise<ImageRequest | null> {
    const db = await getDatabase();
    const result = await db.collection<ImageRequest>('image_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    return result || null;
  }
}

export const storage = new MongoStorage();
