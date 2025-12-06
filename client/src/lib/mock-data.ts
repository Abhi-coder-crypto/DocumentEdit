export type User = {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
};

export type ImageRequest = {
  id: string;
  userId: string;
  originalUrl: string;
  editedUrl?: string;
  status: 'pending' | 'completed';
  uploadedAt: string;
  userEmail?: string; // Denormalized for admin view convenience
  userFullName?: string;
};

export const MOCK_ADMIN: User = {
  id: 'admin-1',
  fullName: 'System Admin',
  email: 'admin@portal.com',
  role: 'admin',
  createdAt: new Date().toISOString()
};

// Initial mock data
export const MOCK_REQUESTS: ImageRequest[] = [
  {
    id: 'req-1',
    userId: 'user-1',
    userFullName: 'Sarah Miller',
    userEmail: 'sarah@example.com',
    originalUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=600',
    status: 'pending',
    uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
  },
  {
    id: 'req-2',
    userId: 'user-2',
    userFullName: 'John Doe',
    userEmail: 'john@example.com',
    originalUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600',
    editedUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600&h=600', // In real app this would be transparent
    status: 'completed',
    uploadedAt: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
  }
];