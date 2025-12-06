import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, Shield, User, Mail, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import bgImage from "@assets/WhatsApp_Image_2025-12-06_at_13.32.22_360ccc6f_1765025570142.jpg";

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
  
  const accentColor = isAdmin ? 'amber' : 'blue';
  const gradientFrom = isAdmin ? 'from-amber-600' : 'from-blue-600';
  const gradientTo = isAdmin ? 'to-orange-500' : 'to-cyan-500';

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden">
          <div className={`h-2 w-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`} />
          <CardHeader className="space-y-1 text-center pb-4 pt-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
              {step === 'login' ? title : 'Verify Your Email'}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {step === 'login' 
                ? subtitle 
                : 'Enter the 6-digit code sent to your email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8 px-8">
            <AnimatePresence mode="wait">
              {step === 'login' ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  placeholder="Enter your full name" 
                                  {...field} 
                                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                                  data-testid="input-fullname"
                                />
                              </div>
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
                            <FormLabel className="text-slate-700 font-medium">Email Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input 
                                  placeholder="you@example.com" 
                                  {...field} 
                                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                                  data-testid="input-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 transition-opacity shadow-lg`}
                        disabled={isLoading} 
                        data-testid="button-send-otp"
                      >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {isLoading ? 'Sending Code...' : 'Send Login Code'}
                        {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                    <p className="text-sm text-slate-500 mb-3">
                      {isAdmin ? 'Not an admin?' : 'Are you an admin?'}
                    </p>
                    <Link href={isAdmin ? '/auth/client' : '/auth/admin'}>
                      <Button 
                        variant="outline" 
                        className="gap-2 border-slate-300 hover:bg-slate-50"
                        data-testid="button-switch-portal"
                      >
                        {isAdmin ? (
                          <>
                            <User className="h-4 w-4" />
                            Go to Client Portal
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
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
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">Check your inbox</p>
                        <p className="text-xs text-green-600">We sent a code to {loginForm.getValues('email')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
                      <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-medium">Verification Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000000" 
                                maxLength={6} 
                                className="h-14 bg-slate-50 text-center text-2xl tracking-[0.5em] font-mono border-slate-200 focus:border-blue-500" 
                                {...field}
                                data-testid="input-otp"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className={`w-full h-12 text-base font-semibold bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 transition-opacity shadow-lg`}
                        disabled={isLoading} 
                        data-testid="button-verify-otp"
                      >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {isLoading ? 'Verifying...' : 'Verify & Login'}
                        {!isLoading && <CheckCircle2 className="ml-2 h-5 w-5" />}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-slate-500 hover:text-slate-700"
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
        
        <p className="text-center text-white/60 text-sm mt-6">
          Cipla Healthcare Portal
        </p>
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
