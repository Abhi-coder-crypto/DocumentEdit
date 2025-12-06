import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ImageRequest } from "@/lib/mock-data";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Clock, Download, LogOut, Image as ImageIcon, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

// Assets
import originalPlaceholder from "@assets/generated_images/professional_headshot_busy_background.png";
import editedPlaceholder from "@assets/generated_images/professional_headshot_transparent_background.png";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [request, setRequest] = useState<ImageRequest | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Finish upload
        const newRequest: ImageRequest = {
          id: Math.random().toString(36),
          userId: user?.id || 'unknown',
          originalUrl: originalPlaceholder, // In real app, this would be the uploaded file URL
          status: 'pending',
          uploadedAt: new Date().toISOString(),
        };
        setRequest(newRequest);
        setIsUploading(false);
        setShowSuccessDialog(true);
      }
    }, 200);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isUploading || !!request,
  });

  // Simulate admin completing the work for demo purposes
  const simulateCompletion = () => {
    if (!request) return;
    setRequest({
      ...request,
      status: 'completed',
      editedUrl: editedPlaceholder
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">BG Remover</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="default" size="sm" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Portal
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your image requests and downloads.</p>
        </div>

        {!request ? (
          <Card className="border-dashed border-2 shadow-none bg-slate-50/50">
            <CardContent className="pt-6">
              <div
                {...getRootProps()}
                className={`
                  min-h-[400px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed 
                  transition-all duration-200 cursor-pointer relative overflow-hidden
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-100'}
                `}
              >
                <input {...getInputProps()} />
                
                {isUploading ? (
                  <div className="w-full max-w-xs space-y-4 text-center relative z-10">
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Uploading your image...</h3>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">Please wait while we secure your file.</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-8 relative z-10">
                    <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-xl">Upload your photo</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        Drag and drop your image here, or click to browse.
                        We support JPG and PNG files.
                      </p>
                    </div>
                    <Button variant="outline" className="mt-4">Select File</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="overflow-hidden border-none shadow-lg">
              <div className={`h-2 w-full ${request.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      Request #{request.id.substr(0, 8)}
                      {request.status === 'completed' ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-amber-600 bg-amber-50">Pending</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Uploaded on {new Date(request.uploadedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      <span>Est. delivery: 3 days</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Original Image */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Original Upload</h4>
                    <div className="aspect-square rounded-xl overflow-hidden border bg-slate-100 relative group">
                      <img 
                        src={request.originalUrl} 
                        alt="Original" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Edited Image */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Edited Result</h4>
                    <div className="aspect-square rounded-xl overflow-hidden border bg-slate-100 relative flex items-center justify-center">
                      {request.status === 'completed' && request.editedUrl ? (
                        <div className="relative w-full h-full group">
                          <img 
                            src={request.editedUrl} 
                            alt="Edited" 
                            className="w-full h-full object-contain p-4" 
                            style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 space-y-2 opacity-50">
                          <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
                          <p className="font-medium">Processing...</p>
                          <p className="text-sm text-muted-foreground">Your image is being edited by our team.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Demo Control for User to simulate admin action */}
              {request.status === 'pending' && (
                <CardFooter className="bg-slate-50 border-t p-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={simulateCompletion} className="text-xs text-muted-foreground">
                    (Demo: Simulate Admin Completion)
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Success Popup */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl">Upload Successful!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              We have received your photo. You will get your edited image on this portal within 3 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full sm:w-auto">
              Got it, thanks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}