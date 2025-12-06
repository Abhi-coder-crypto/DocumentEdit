import { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, fullName: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ email: string; fullName: string } | null>(null);
  const { toast } = useToast();

  const login = async (email: string, fullName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setPendingLogin({ email, fullName });
      
      if (data.otp) {
        toast({
          title: "Your Login Code",
          description: `Your OTP is: ${data.otp}`,
          duration: 60000,
        });
      } else {
        toast({
          title: "OTP Sent",
          description: `We sent a verification code to ${email}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to send OTP',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    if (!pendingLogin) return false;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingLogin.email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Verification Failed",
          description: data.message || 'Invalid OTP',
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }

      setUser(data.user);
      setPendingLogin(null);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to verify OTP',
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPendingLogin(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
