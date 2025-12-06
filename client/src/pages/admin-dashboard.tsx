import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { MOCK_REQUESTS, ImageRequest } from "@/lib/mock-data";
import { LogOut, Download, Upload, Check, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import editedPlaceholder from "@assets/generated_images/professional_headshot_transparent_background.png";

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [requests, setRequests] = useState<ImageRequest[]>(MOCK_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<ImageRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = requests.filter(req => 
    req.userFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadEdited = () => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: 'completed' as const, editedUrl: editedPlaceholder } 
        : req
    );
    
    setRequests(updatedRequests);
    setSelectedRequest(null);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-xl">Admin Portal</span>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none">v1.0</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-white hover:bg-slate-800">
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
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="bg-white">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.userFullName}</div>
                      <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                    </TableCell>
                    <TableCell>{new Date(req.uploadedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={req.status === 'completed' ? 'default' : 'secondary'}
                        className={req.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}
                      >
                        {req.status === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={req.originalUrl} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Original
                          </a>
                        </Button>
                        {req.status === 'pending' && (
                          <Button size="sm" onClick={() => setSelectedRequest(req)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Edit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Upload Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Edited Image</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Original Image</Label>
              <div className="aspect-video w-full bg-slate-100 rounded-md overflow-hidden">
                <img 
                  src={selectedRequest?.originalUrl} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="p-8 border-2 border-dashed rounded-lg text-center space-y-2 hover:bg-slate-50 cursor-pointer transition-colors" onClick={handleUploadEdited}>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Click to simulate uploading edited file</p>
              <p className="text-xs text-muted-foreground">(For this demo, a placeholder image will be used)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}