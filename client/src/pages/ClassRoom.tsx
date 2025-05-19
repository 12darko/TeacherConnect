import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCall } from "@/components/ui/video-call";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon, Trash2, Clock, Download, PlusCircle, Save, RefreshCw, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Paylaşılan tip tanımlamaları
type SessionNote = {
  id: number;
  sessionId: number;
  userId: string;
  userName?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
};

type WhiteboardSnapshot = {
  id: number;
  sessionId: number;
  imageData?: string;
  imageUrl?: string;
  userId: string;
  userName?: string | null;
  title: string;
  createdAt: string;
};

type SessionRecording = {
  id: number;
  sessionId: number;
  recordingUrl: string;
  duration: number;
  userId: string;
  createdAt: string;
};

type SessionFile = {
  id: number;
  sessionId: number;
  uploadedBy?: string;
  userId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

type Session = {
  id: number;
  teacherId: string;
  studentId: string;
  teacherName: string;
  studentName: string;
  subjectId: number;
  subjectName: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ClassRoom() {
  const [, params] = useRoute("/classroom/:id");
  const sessionId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("notes");
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  
  // Beyaz tahta için gerekli değişkenler
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [whiteboardTitle, setWhiteboardTitle] = useState("");
  const [isWhiteboardSaveDialogOpen, setIsWhiteboardSaveDialogOpen] = useState(false);
  
  // Session bilgilerini çekme
  const sessionQuery = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return await res.json();
    },
    enabled: !!sessionId
  });
  
  const { data: sessionData, isLoading: isSessionLoading } = sessionQuery;
  
  // Session notlarını çekme
  const { 
    data: sessionNotes = [], 
    isLoading: isNotesLoading,
    error: notesError
  } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/notes`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/notes`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch notes");
        }
        return await res.json();
      } catch (error) {
        console.error("Query error:", error);
        return [];
      }
    },
    enabled: !!sessionId && !isSessionEnded
  });
  
  // Session kayıtlarını çekme
  const { 
    data: sessionRecordings = [], 
    isLoading: isRecordingsLoading,
    error: recordingsError
  } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/recordings`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/recordings`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch recordings");
        }
        return await res.json();
      } catch (error) {
        console.error("API Error:", error);
        return [];
      }
    },
    enabled: !!sessionId && !isSessionEnded
  });
  
  // Whiteboard snapshot'ları çekme
  const { 
    data: sessionWhiteboardSnapshots = [], 
    isLoading: isWhiteboardLoading,
    error: whiteboardError
  } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/whiteboard`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/whiteboard`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch whiteboard snapshots");
        }
        return await res.json();
      } catch (error) {
        console.error("API Error:", error);
        return [];
      }
    },
    enabled: !!sessionId && !isSessionEnded
  });
  
  // Paylaşılan dosyaları çekme
  const { 
    data: sessionFiles = [], 
    isLoading: isFilesLoading,
    error: filesError
  } = useQuery({
    queryKey: [`/api/sessions/${sessionId}/files`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/files`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch files");
        }
        return await res.json();
      } catch (error) {
        console.error("API Error:", error);
        return [];
      }
    },
    enabled: !!sessionId && !isSessionEnded
  });

  // Mutations for interacting with the session content
  const saveNoteMutation = useMutation({
    mutationFn: async (noteData: { userId: string, content: string, isPrivate: boolean }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/notes`, 
        noteData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/notes`] });
      toast({
        title: "Not Kaydedildi",
        description: "Notunuz başarıyla kaydedildi.",
      });
      setNoteContent("");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Not kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/sessions/${sessionId}/notes/${noteId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/notes`] });
      toast({
        title: "Not Silindi",
        description: "Not başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Not silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const saveWhiteboardMutation = useMutation({
    mutationFn: async (snapshotData: { imageData: string, title: string, userId: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/whiteboard`, 
        snapshotData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/whiteboard`] });
      toast({
        title: "Whiteboard Kaydedildi",
        description: "Whiteboard başarıyla kaydedildi.",
      });
      setWhiteboardTitle("");
      setIsWhiteboardSaveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Whiteboard kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const deleteWhiteboardMutation = useMutation({
    mutationFn: async (snapshotId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/sessions/${sessionId}/whiteboard/${snapshotId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/whiteboard`] });
      toast({
        title: "Whiteboard Silindi",
        description: "Whiteboard başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Whiteboard silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const saveRecordingMutation = useMutation({
    mutationFn: async (recordingData: { recordingUrl: string, duration: number, userId: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/recordings`, 
        recordingData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/recordings`] });
      toast({
        title: "Kayıt Eklendi",
        description: "Kayıt başarıyla eklendi.",
      });
      setRecordingUrl("");
      setRecordingDuration(0);
      setIsRecordingDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Kayıt eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/sessions/${sessionId}/recordings/${recordingId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/recordings`] });
      toast({
        title: "Kayıt Silindi",
        description: "Kayıt başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Kayıt silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const saveFileMutation = useMutation({
    mutationFn: async (fileData: { fileUrl: string, fileName: string, fileType: string, fileSize: number, userId: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/files`, 
        fileData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/files`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      toast({
        title: "Dosya Paylaşıldı",
        description: "Dosya başarıyla paylaşıldı.",
      });
      setFileUrl("");
      setFileName("");
      setFileType("");
      setFileSize(0);
      setIsFileDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Dosya paylaşılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest(
        "DELETE", 
        `/api/sessions/${sessionId}/files/${fileId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/files`] });
      toast({
        title: "Dosya Silindi",
        description: "Dosya başarıyla silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Dosya silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Dersi sonlandırma işlemleri
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH", 
        `/api/sessions/${sessionId}`, 
        { status: "completed" }
      );
      return await response.json();
    },
    onSuccess: () => {
      setIsSessionEnded(true);
      toast({
        title: "Ders Sonlandırıldı",
        description: "Ders başarıyla sonlandırıldı.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ders sonlandırılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Canvas işlemleri için fonksiyonlar
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    setIsDrawing(true);
    
    const rect = canvas.getBoundingClientRect();
    setCurrentPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.moveTo(currentPosition.x, currentPosition.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setCurrentPosition({ x, y });
  };
  
  const endDrawing = () => {
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  
  const saveWhiteboardSnapshot = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    
    if (!user) return;
    
    setIsWhiteboardSaveDialogOpen(true);
  };
  
  const confirmWhiteboardSave = () => {
    if (!canvasRef.current || !user) return;
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    
    saveWhiteboardMutation.mutate({
      imageData,
      title: whiteboardTitle || 'Whiteboard Snapshot',
      userId: user.id
    });
  };

  // Whiteboard canvas'ını yükle
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Canvas'ı temizle ve varsayılan ayarları uygula
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Çizim stilini ayarla
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
      }
    }
  }, [strokeColor, strokeWidth]);

  // Dosya paylaşım işlemleri
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Normalde burada dosya yükleme işlemi yapılır ve bir URL döner
    // Bu örnekte sahte bir URL kullanıyoruz
    setFileName(file.name);
    setFileType(file.type);
    setFileSize(file.size);
    
    // Dosya yükleme simülasyonu - gerçek uygulamada bulut depolama kullanılabilir
    const fakeUrl = `https://storage.example.com/files/${Date.now()}_${file.name}`;
    setFileUrl(fakeUrl);
    
    setIsFileDialogOpen(true);
  };
  
  const handleFileShare = () => {
    if (!user || !fileUrl) return;
    
    saveFileMutation.mutate({
      fileUrl,
      fileName,
      fileType,
      fileSize,
      userId: user.id
    });
  };

  // Kayıt işlemleri
  const handleRecordingSubmit = () => {
    if (!user || !recordingUrl) return;
    
    saveRecordingMutation.mutate({
      recordingUrl,
      duration: recordingDuration,
      userId: user.id
    });
  };

  // Not ekleme işlemleri
  const handleNoteSubmit = () => {
    if (!user || !noteContent.trim()) return;
    
    saveNoteMutation.mutate({
      userId: user.id,
      content: noteContent,
      isPrivate: notePrivate
    });
  };

  // Dersi sonlandırma
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  const handleEndSession = () => {
    if (showEndConfirm) {
      endSessionMutation.mutate();
      setShowEndConfirm(false);
    } else {
      setShowEndConfirm(true);
    }
  };

  // Sayfa yüklendiğinde session durumunu kontrol et
  useEffect(() => {
    if (sessionData && sessionData.status === "completed") {
      setIsSessionEnded(true);
    }
  }, [sessionData]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <h1 className="text-2xl font-bold ml-2">
            {isSessionLoading ? "Yükleniyor..." : sessionData?.subjectName} Dersi
          </h1>
        </div>
        
        {!isSessionEnded && (
          <Button 
            variant="destructive" 
            onClick={handleEndSession}
            disabled={endSessionMutation.isPending}
            className="ml-auto flex items-center"
          >
            {showEndConfirm ? "Emin misiniz? Tıklayın" : "Dersi Sonlandır"}
            {endSessionMutation.isPending && (
              <div className="ml-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            )}
          </Button>
        )}
      </div>
      
      {isSessionLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>Video Görüşmesi</CardTitle>
                  <CardDescription>
                    Öğrenci: {sessionData?.studentName} | Başlangıç: {format(new Date(sessionData?.startTime || ""), "HH:mm")} - Bitiş: {format(new Date(sessionData?.endTime || ""), "HH:mm")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VideoCall 
                    isTeacher={user?.role === "teacher"} 
                    isSessionActive={!isSessionEnded} 
                    sessionId={sessionId}
                    onEndCall={() => {
                      // Ders tamamlandığında yeniden veri çekme
                      sessionQuery.refetch();
                      toast({
                        title: "Ders tamamlandı",
                        description: "Ders başarıyla sonlandırıldı ve kaydedildi.",
                      });
                    }}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Araçlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="notes">Notlar</TabsTrigger>
                      <TabsTrigger value="whiteboard">Beyaz Tahta</TabsTrigger>
                      <TabsTrigger value="files">Dosyalar</TabsTrigger>
                      <TabsTrigger value="recordings">Kayıtlar</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="notes" className="space-y-4">
                      {!isSessionEnded && (
                        <div className="space-y-2">
                          <Textarea 
                            placeholder="Notlarınızı buraya yazın..." 
                            className="min-h-[100px]"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id="private-note" 
                                checked={notePrivate}
                                onChange={(e) => setNotePrivate(e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <label htmlFor="private-note" className="text-sm text-gray-600">Özel Not (Sadece siz görebilirsiniz)</label>
                            </div>
                            <Button 
                              onClick={handleNoteSubmit}
                              disabled={!noteContent.trim() || saveNoteMutation.isPending}
                            >
                              Kaydet
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Notlar</h3>
                        {isNotesLoading ? (
                          <div className="flex items-center justify-center h-20">
                            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : sessionNotes && sessionNotes.length > 0 ? (
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-4">
                              {sessionNotes.map((note) => (
                                <div key={note.id} className={`p-4 rounded-lg ${note.isPrivate ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center">
                                        <span className="font-medium">{note.userName || 'Kullanıcı'}</span>
                                        {note.isPrivate && (
                                          <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full">Özel</span>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {format(new Date(note.createdAt), "d MMMM, HH:mm")}
                                      </span>
                                    </div>
                                    {user?.id === note.userId && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => deleteNoteMutation.mutate(note.id)}
                                        disabled={deleteNoteMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            Henüz not eklenmemiş.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="whiteboard">
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden bg-white">
                          <canvas 
                            ref={canvasRef} 
                            width={800} 
                            height={500}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={endDrawing}
                            onMouseLeave={endDrawing}
                            className="w-full touch-none"
                          />
                        </div>
                        
                        {!isSessionEnded && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div>
                                <label htmlFor="stroke-color" className="sr-only">Renk</label>
                                <input 
                                  type="color" 
                                  id="stroke-color" 
                                  value={strokeColor}
                                  onChange={(e) => setStrokeColor(e.target.value)}
                                  className="w-8 h-8 rounded cursor-pointer"
                                />
                              </div>
                              <div>
                                <label htmlFor="stroke-width" className="sr-only">Kalınlık</label>
                                <input 
                                  type="range" 
                                  id="stroke-width" 
                                  min="1" 
                                  max="10" 
                                  value={strokeWidth}
                                  onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                                  className="w-24"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" onClick={clearCanvas}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Temizle
                              </Button>
                              <Button onClick={saveWhiteboardSnapshot}>
                                <Save className="h-4 w-4 mr-2" />
                                Kaydet
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-3">Kaydedilen Whiteboard'lar</h3>
                          {isWhiteboardLoading ? (
                            <div className="flex items-center justify-center h-20">
                              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                            </div>
                          ) : sessionWhiteboardSnapshots && sessionWhiteboardSnapshots.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {sessionWhiteboardSnapshots.map((snapshot) => (
                                <div key={snapshot.id} className="border rounded-lg overflow-hidden bg-white">
                                  <div className="aspect-video relative group">
                                    <img 
                                      src={snapshot.imageData || snapshot.imageUrl} 
                                      alt={snapshot.title} 
                                      className="w-full h-full object-contain"
                                    />
                                    {user?.id === snapshot.userId && (
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deleteWhiteboardMutation.mutate(snapshot.id)}
                                        disabled={deleteWhiteboardMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="p-2">
                                    <p className="text-sm font-medium truncate">{snapshot.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {format(new Date(snapshot.createdAt), "d MMMM, HH:mm")} - {snapshot.userName || 'Kullanıcı'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              Henüz kaydedilmiş whiteboard yok.
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="recordings">
                      <div className="space-y-4">
                        {!isSessionEnded && (
                          <div className="flex justify-end">
                            <Button onClick={() => setIsRecordingDialogOpen(true)}>
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Kayıt Ekle
                            </Button>
                          </div>
                        )}
                        
                        {isRecordingsLoading ? (
                          <div className="flex items-center justify-center h-20">
                            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : sessionRecordings && sessionRecordings.length > 0 ? (
                          <div className="space-y-4">
                            {sessionRecordings.map((recording) => (
                              <div key={recording.id} className="p-4 rounded-lg border flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3">
                                    <Clock className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium">Kayıt #{recording.id}</div>
                                    <div className="text-sm text-gray-500">
                                      Süre: {Math.floor(recording.duration / 60)}m {recording.duration % 60}s | 
                                      {format(new Date(recording.createdAt), "d MMMM, HH:mm")}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => window.open(recording.recordingUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  
                                  {user?.id === recording.userId && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => deleteRecordingMutation.mutate(recording.id)}
                                      disabled={deleteRecordingMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            Henüz kayıt eklenmemiş.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="files">
                      <div className="space-y-4">
                        {!isSessionEnded && (
                          <div className="flex justify-end">
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                <Upload className="h-4 w-4 mr-2" />
                                Dosya Yükle
                              </div>
                              <input 
                                id="file-upload" 
                                type="file" 
                                className="hidden" 
                                onChange={handleFileUpload}
                              />
                            </label>
                          </div>
                        )}
                        
                        {isFilesLoading ? (
                          <div className="flex items-center justify-center h-20">
                            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        ) : sessionFiles && sessionFiles.length > 0 ? (
                          <div className="space-y-4 max-h-40 overflow-y-auto">
                            {sessionFiles.map((file, index) => (
                              <div key={index} className="flex items-center bg-gray-50 rounded p-2 text-sm">
                                <div className="bg-emerald-100 p-1.5 rounded mr-2">
                                  <Download className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{file.fileName}</div>
                                  <div className="text-xs text-gray-500">
                                    {(file.fileSize / 1024).toFixed(1)} KB • {format(new Date(file.uploadedAt), "d MMMM")}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => window.open(file.fileUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  
                                  {(user?.id === file.uploadedBy || user?.id === file.userId) && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => deleteFileMutation.mutate(file.id)}
                                      disabled={deleteFileMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            Henüz dosya paylaşılmamış.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Ders Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Öğretmen</h3>
                      <p className="flex items-center">
                        {sessionData?.teacherProfileImageUrl && (
                          <img 
                            src={sessionData.teacherProfileImageUrl} 
                            alt="Öğretmen" 
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                          />
                        )}
                        <span className="font-medium">{sessionData?.teacherName || "İsim bilgisi yok"}</span>
                        {sessionData?.teacherEmail && (
                          <span className="ml-2 text-xs text-gray-500">({sessionData.teacherEmail})</span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Öğrenci</h3>
                      <p className="flex items-center">
                        {sessionData?.studentProfileImageUrl && (
                          <img 
                            src={sessionData.studentProfileImageUrl} 
                            alt="Öğrenci" 
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                          />
                        )}
                        <span className="font-medium">{sessionData?.studentName || "İsim bilgisi yok"}</span>
                        {sessionData?.studentEmail && (
                          <span className="ml-2 text-xs text-gray-500">({sessionData.studentEmail})</span>
                        )}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Ders</h3>
                      <p>{sessionData?.subjectName}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tarih ve Saat</h3>
                      <p>
                        {sessionData?.startTime && format(new Date(sessionData.startTime), "d MMMM yyyy")}
                        <br />
                        {sessionData?.startTime && format(new Date(sessionData.startTime), "HH:mm")} - 
                        {sessionData?.endTime && format(new Date(sessionData.endTime), "HH:mm")}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Durum</h3>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isSessionEnded || sessionData?.status === "completed" 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isSessionEnded || sessionData?.status === "completed" ? 'Tamamlandı' : 'Aktif'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Whiteboard Save Dialog */}
          <Dialog open={isWhiteboardSaveDialogOpen} onOpenChange={setIsWhiteboardSaveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Whiteboard Kaydet</DialogTitle>
                <DialogDescription>
                  Whiteboard için bir başlık girin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık</Label>
                  <Input 
                    id="title" 
                    value={whiteboardTitle} 
                    onChange={(e) => setWhiteboardTitle(e.target.value)} 
                    placeholder="Whiteboard başlığı"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsWhiteboardSaveDialogOpen(false)}>
                  İptal
                </Button>
                <Button 
                  onClick={confirmWhiteboardSave}
                  disabled={saveWhiteboardMutation.isPending}
                >
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Recording Add Dialog */}
          <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kayıt Ekle</DialogTitle>
                <DialogDescription>
                  Ders kaydı eklemek için lütfen URL ve süre bilgilerini girin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="recording-url">Kayıt URL</Label>
                  <Input 
                    id="recording-url" 
                    value={recordingUrl} 
                    onChange={(e) => setRecordingUrl(e.target.value)} 
                    placeholder="https://example.com/recording.mp4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recording-duration">Süre (saniye)</Label>
                  <Input 
                    id="recording-duration" 
                    type="number" 
                    value={recordingDuration} 
                    onChange={(e) => setRecordingDuration(parseInt(e.target.value))} 
                    placeholder="60"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRecordingDialogOpen(false)}>
                  İptal
                </Button>
                <Button 
                  onClick={handleRecordingSubmit}
                  disabled={!recordingUrl || recordingDuration <= 0 || saveRecordingMutation.isPending}
                >
                  Ekle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* File Share Dialog */}
          <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dosya Paylaş</DialogTitle>
                <DialogDescription>
                  Seçtiğiniz dosyayı paylaşmak için onaylayın.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium">{fileName}</div>
                  <div className="text-sm text-gray-500">
                    {(fileSize / 1024).toFixed(1)} KB • {fileType}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>
                  İptal
                </Button>
                <Button 
                  onClick={handleFileShare}
                  disabled={!fileUrl || saveFileMutation.isPending}
                >
                  Paylaş
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}