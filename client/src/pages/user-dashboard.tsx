import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, Clock, Download, LogOut, Image as ImageIcon, AlertCircle, ShieldCheck, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket, WSMessage } from "@/hooks/use-websocket";

interface ImageRequest {
  id: string;
  originalFileName: string;
  originalFilePath: string;
  editedFileName?: string;
  editedFilePath?: string;
  status: 'pending' | 'completed';
  uploadedAt: string;
  completedAt?: string;
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ImageRequest[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    if (message.type === 'image_edited') {
      const editedRequest = message.data;
      setRequests(prev => prev.map(req => 
        req.id === editedRequest.id 
          ? { 
              ...req, 
              status: 'completed' as const,
              editedFileName: editedRequest.editedFileName,
              editedFilePath: editedRequest.editedFilePath,
              completedAt: editedRequest.completedAt,
            }
          : req
      ));
      toast({
        title: "Image Ready!",
        description: `Your image "${editedRequest.originalFileName}" has been edited and is ready for download.`,
      });
    }
  }, [toast]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/images/user/${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('image', acceptedFiles[0]);
    formData.append('userId', user.id);
    formData.append('userEmail', user.email);
    formData.append('userFullName', user.fullName);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      await fetchRequests();
      setShowSuccessDialog(true);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload image',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const downloadFile = (type: 'original' | 'edited', filePath: string) => {
    const filename = filePath.split('/').pop();
    window.open(`/api/images/download/${type}/${filename}`, '_blank');
  };

  const latestRequest = requests.length > 0 ? requests[requests.length - 1] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">BG Remover</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title={isConnected ? 'Real-time updates active' : 'Reconnecting...'}>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground animate-pulse" />
              )}
            </div>
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="default" size="sm" className="gap-2" data-testid="link-admin-portal">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Portal
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your image requests and downloads.</p>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={isLoading} data-testid="button-refresh">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="border-dashed border-2 shadow-none bg-slate-50/50 mb-8">
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`
                min-h-[300px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed 
                transition-all duration-200 cursor-pointer relative overflow-hidden
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-100'}
              `}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} data-testid="input-file" />
              
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
                  <Button variant="outline" className="mt-4" data-testid="button-select-file">Select File</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {requests.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Your Requests</h2>
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden border-none shadow-lg" data-testid={`card-request-${request.id}`}>
                <div className={`h-2 w-full ${request.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {request.originalFileName}
                        {request.status === 'completed' ? (
                          <Badge className="bg-green-500 hover:bg-green-600" data-testid={`badge-status-${request.id}`}>Completed</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-amber-600 bg-amber-50" data-testid={`badge-status-${request.id}`}>Pending</Badge>
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
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => downloadFile('original', request.originalFilePath)}
                      data-testid={`button-download-original-${request.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Original
                    </Button>
                    
                    {request.status === 'completed' && request.editedFilePath && (
                      <Button 
                        onClick={() => downloadFile('edited', request.editedFilePath!)}
                        data-testid={`button-download-edited-${request.id}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Edited
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

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
            <Button onClick={() => setShowSuccessDialog(false)} className="w-full sm:w-auto" data-testid="button-close-success">
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
