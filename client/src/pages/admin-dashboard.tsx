import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Download, Upload, Check, Search, Filter, RefreshCw, Wifi, WifiOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { useWebSocket, WSMessage } from "@/hooks/use-websocket";
import { Link } from "wouter";

interface ImageRequest {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  originalFileName: string;
  originalFilePath: string;
  editedFileName?: string;
  editedFilePath?: string;
  status: 'pending' | 'completed';
  uploadedAt: string;
  completedAt?: string;
}

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ImageRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ImageRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    if (message.type === 'new_image_upload') {
      const newRequest = message.data;
      setRequests(prev => {
        const exists = prev.some(req => String(req.id) === String(newRequest.id));
        if (exists) return prev;
        return [...prev, {
          id: String(newRequest.id),
          userId: String(newRequest.userId),
          userEmail: newRequest.userEmail,
          userFullName: newRequest.userFullName,
          originalFileName: newRequest.originalFileName,
          originalFilePath: newRequest.originalFilePath,
          status: 'pending' as const,
          uploadedAt: newRequest.uploadedAt,
        }];
      });
      toast({
        title: "New Image Upload",
        description: `${newRequest.userFullName} uploaded "${newRequest.originalFileName}"`,
      });
    } else if (message.type === 'image_edited') {
      const editedRequest = message.data;
      setRequests(prev => prev.map(req => 
        String(req.id) === String(editedRequest.id) 
          ? { 
              ...req, 
              status: 'completed' as const, 
              editedFileName: editedRequest.editedFileName, 
              editedFilePath: editedRequest.editedFilePath, 
              completedAt: editedRequest.completedAt 
            }
          : req
      ));
      toast({
        title: "Image Edited",
        description: `Request for "${editedRequest.originalFileName}" has been completed`,
      });
    }
  }, [toast]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/requests');
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        throw new Error(data.message || 'Failed to fetch requests');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch requests',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter(req => 
    req.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !selectedRequest) return;

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('editedImage', acceptedFiles[0]);

    try {
      const response = await fetch(`/api/admin/upload-edited/${selectedRequest.id}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      toast({
        title: "Success",
        description: "Edited image uploaded successfully",
      });

      await fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload edited image',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const downloadOriginal = (filePath: string) => {
    const filename = filePath.split('/').pop();
    window.open(`/api/images/download/original/${filename}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-xl">Admin Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" title={isConnected ? 'Real-time updates active' : 'Reconnecting...'}>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-slate-400 animate-pulse" />
              )}
            </div>
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-slate-800 gap-2" data-testid="link-client-portal">
                <User className="h-4 w-4" />
                Client View
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={logout} className="text-white hover:bg-slate-800" data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Requests</h1>
            <p className="text-slate-500">Manage and process background removal requests.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={fetchRequests} disabled={isLoading} className="bg-white" data-testid="button-refresh">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>User</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">Loading requests...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} data-testid={`row-request-${req.id}`}>
                      <TableCell>
                        <div className="font-medium">{req.userFullName}</div>
                        <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {req.originalFileName}
                      </TableCell>
                      <TableCell>{new Date(req.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={req.status === 'completed' ? 'default' : 'secondary'}
                          className={req.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}
                          data-testid={`badge-status-${req.id}`}
                        >
                          {req.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => downloadOriginal(req.originalFilePath)}
                            data-testid={`button-download-${req.id}`}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Original
                          </Button>
                          {req.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedRequest(req)}
                              data-testid={`button-upload-edit-${req.id}`}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Edited Image</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Request Details</Label>
              <div className="text-sm text-muted-foreground">
                <p><strong>User:</strong> {selectedRequest?.userFullName}</p>
                <p><strong>Email:</strong> {selectedRequest?.userEmail}</p>
                <p><strong>Original File:</strong> {selectedRequest?.originalFileName}</p>
              </div>
            </div>
            
            <div 
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center space-y-2 cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'hover:bg-slate-50'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
              data-testid="dropzone-edited"
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <>
                  <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                  <p className="text-sm font-medium">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click or drag to upload edited image</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG with transparent background</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} data-testid="button-cancel-upload">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
