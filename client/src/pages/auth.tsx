import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, Shield } from "lucide-react";
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

export default function AuthPage() {
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
    await login(values.email, values.fullName);
    setStep('otp');
  };

  const onOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    const success = await verifyOtp(values.otp);
    if (success) {
      setLocation("/");
    } else {
      otpForm.setError("otp", { message: "Invalid OTP. Try 123456" });
    }
  };

  // Helper to auto-fill admin credentials for demo
  const fillAdminDemo = () => {
    loginForm.setValue("fullName", "System Admin");
    loginForm.setValue("email", "admin@portal.com");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Image with Overlay */}
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
          <CardHeader className="space-y-1 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === 'login' ? 'Welcome Back' : 'Verify Identity'}
            </CardTitle>
            <CardDescription>
              {step === 'login' 
                ? 'Enter your details to access the portal' 
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
                              <Input placeholder="John Doe" {...field} className="bg-white" />
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
                              <Input placeholder="john@example.com" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Login Code
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-6 pt-6 border-t flex justify-center">
                     <Button variant="ghost" size="sm" onClick={fillAdminDemo} className="text-xs text-muted-foreground hover:text-primary">
                       <Shield className="w-3 h-3 mr-1" />
                       Fill Admin Credentials (Demo)
                     </Button>
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
                                placeholder="123456" 
                                maxLength={6} 
                                className="bg-white text-center text-lg tracking-[0.5em] font-mono" 
                                {...field} 
                              />
                            </FormControl>
                            <CardDescription className="text-xs text-center pt-2">
                              For demo purposes, use code: <strong>123456</strong>
                            </CardDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify & Login
                        {!isLoading && <CheckCircle2 className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-muted-foreground"
                        onClick={() => setStep('login')}
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