import { createContext, useContext, useState, ReactNode } from "react";
import { User, MOCK_ADMIN } from "./mock-data";
import { useToast } from "@/hooks/use-toast";

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
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPendingLogin({ email, fullName });
    setIsLoading(false);
    
    toast({
      title: "OTP Sent",
      description: `We sent a verification code to ${email}`,
    });
  };

  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (otp === "123456" && pendingLogin) {
      // Check if it's the admin
      if (pendingLogin.email === MOCK_ADMIN.email) {
        setUser(MOCK_ADMIN);
      } else {
        setUser({
          id: Math.random().toString(36).substr(2, 9),
          email: pendingLogin.email,
          fullName: pendingLogin.fullName,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      setPendingLogin(null);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
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