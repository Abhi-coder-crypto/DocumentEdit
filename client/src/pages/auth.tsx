import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import bgImage from "@assets/generated_images/abstract_mesh_gradient_background.png";

const loginSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

interface AuthPageProps {
  loginType?: 'client' | 'admin';
}

function AuthPageContent({ loginType = 'client' }: AuthPageProps) {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const { login, verifyOtp, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { fullName: "", email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    const success = await login(values.email, values.fullName, loginType);
    if (success) {
      setStep('otp');
    }
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    const success = await verifyOtp(values.otp);
    if (success) {
      setLocation(loginType === 'admin' ? "/admin" : "/");
    } else {
      otpForm.setError("otp", { message: "Invalid OTP. Please try again." });
    }
  };

  const isAdmin = loginType === 'admin';
  const Icon = isAdmin ? Shield : User;
  const title = isAdmin ? 'Admin Portal' : 'Client Portal';
  const subtitle = isAdmin 
    ? 'Sign in to manage image requests' 
    : 'Sign in to upload and download images';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-none shadow-xl bg-white/90 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className={`p-3 rounded-full ${isAdmin ? 'bg-amber-100' : 'bg-blue-100'}`}>
                <Icon className={`h-6 w-6 ${isAdmin ? 'text-amber-600' : 'text-blue-600'}`} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === 'login' ? title : 'Verify Identity'}
            </CardTitle>
            <CardDescription>
              {step === 'login' 
                ? subtitle 
                : 'Enter the 6-digit code sent to your email'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'login' ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                className="bg-white" 
                                data-testid="input-fullname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="john@example.com" 
                                {...field} 
                                className="bg-white" 
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-send-otp">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Login Code
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-6 pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                      {isAdmin ? 'Not an admin?' : 'Are you an admin?'}
                    </p>
                    <Link href={isAdmin ? '/auth/client' : '/auth/admin'}>
                      <Button 
                        variant="ghost" 
                        className="mt-2 text-sm"
                        data-testid="button-switch-portal"
                      >
                        {isAdmin ? (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Go to Client Portal
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Go to Admin Portal
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>One-Time Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter code" 
                                maxLength={6} 
                                className="bg-white text-center text-lg tracking-[0.5em] font-mono" 
                                {...field}
                                data-testid="input-otp"
                              />
                            </FormControl>
                            <CardDescription className="text-xs text-center pt-2">
                              Check your email for the verification code
                            </CardDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-verify-otp">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify & Login
                        {!isLoading && <CheckCircle2 className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-muted-foreground"
                        onClick={() => setStep('login')}
                        data-testid="button-back-to-login"
                      >
                        Back to Login
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function ClientAuthPage() {
  return <AuthPageContent loginType="client" />;
}

export function AdminAuthPage() {
  return <AuthPageContent loginType="admin" />;
}

export default function AuthPage() {
  return <AuthPageContent loginType="client" />;
}