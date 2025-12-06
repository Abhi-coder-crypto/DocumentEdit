import { MongoClient, ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface OTPSession {
  _id?: ObjectId;
  email: string;
  fullName: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ImageRequest {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  userFullName: string;
  originalFileName: string;
  originalFilePath: string;
  editedFileName?: string;
  editedFilePath?: string;
  status: 'pending' | 'completed';
  uploadedAt: Date;
  completedAt?: Date;
}

// MongoDB connection
let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function getDatabase() {
  const client = await connectToDatabase();
  return client.db('bg_remover_portal');
}
