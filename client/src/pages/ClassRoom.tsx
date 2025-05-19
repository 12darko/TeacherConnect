import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCall } from "@/components/ui/video-call";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon, Trash2, Clock, Download, PlusCircle, Save, RefreshCw, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClassRoom() {
  const [, params] = useRoute("/classroom/:id");
  const sessionId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
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
  
  // Veri tipleri
  interface Session {
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
  }
  
  interface SessionNote {
    id: number;
    sessionId: number;
    userId: string;
    content: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    userName?: string;
  }
  
  interface SessionFile {
    id: number;
    sessionId: number;
    uploadedBy: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    uploaderName?: string;
  }
  
  interface WhiteboardSnapshot {
    id: number;
    sessionId: number;
    userId: string;
    imageData: string;
    title: string;
    createdAt: string;
    userName?: string;
  }
  
  interface SessionRecording {
    id: number;
    sessionId: number;
    userId: string;
    recordingUrl: string;
    duration: number;
    createdAt: string;
    userName?: string;
  }
  
  // Fetch session details and related content
  const { data: session, isLoading } = useQuery<Session>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch session notes
  const { data: notes = [] } = useQuery<SessionNote[]>({
    queryKey: [`/api/sessions/${sessionId}/notes`],
    enabled: !!sessionId && !isSessionEnded,
  });

  // Fetch session files
  const { data: files = [] } = useQuery<SessionFile[]>({
    queryKey: [`/api/sessions/${sessionId}/files`],
    enabled: !!sessionId && !isSessionEnded,
  });

  // Fetch whiteboard snapshots
  const { data: whiteboardSnapshots = [] } = useQuery<WhiteboardSnapshot[]>({
    queryKey: [`/api/sessions/${sessionId}/whiteboard`],
    enabled: !!sessionId && !isSessionEnded,
  });

  // Fetch session recordings
  const { data: recordings = [] } = useQuery<SessionRecording[]>({
    queryKey: [`/api/sessions/${sessionId}/recordings`],
    enabled: !!sessionId && !isSessionEnded,
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
      setNoteContent("");
      setNotePrivate(false);
      toast({
        title: "Not Kaydedildi",
        description: "Ders notunuz başarıyla kaydedildi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Not Kaydedilemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (fileData: { uploadedBy: string, fileName: string, fileUrl: string, fileType: string, fileSize: number }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/files`, 
        fileData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/files`] });
      setIsFileDialogOpen(false);
      setFileUrl("");
      setFileName("");
      setFileType("");
      setFileSize(0);
      toast({
        title: "Dosya Yüklendi",
        description: "Dosyanız başarıyla yüklendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Dosya Yüklenemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const saveWhiteboardMutation = useMutation({
    mutationFn: async (whiteboardData: { userId: string, imageData: string, title: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/whiteboard`, 
        whiteboardData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/whiteboard`] });
      // Clear the whiteboard after saving
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      toast({
        title: "Tahta Kaydedildi",
        description: "Beyaz tahta görüntüsü başarıyla kaydedildi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Tahta Kaydedilemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const saveRecordingMutation = useMutation({
    mutationFn: async (recordingData: { userId: string, recordingUrl: string, duration: number }) => {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/recordings`, 
        recordingData
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/recordings`] });
      setIsRecordingDialogOpen(false);
      setRecordingUrl("");
      setRecordingDuration(0);
      toast({
        title: "Kayıt Eklendi",
        description: "Ders kaydı başarıyla eklendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Kayıt Eklenemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await apiRequest("DELETE", `/api/sessions/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/notes`] });
      toast({
        title: "Not Silindi",
        description: "Seçilen not başarıyla silindi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Not Silinemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/sessions/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/files`] });
      toast({
        title: "Dosya Silindi",
        description: "Seçilen dosya başarıyla silindi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Dosya Silinemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const deleteWhiteboardMutation = useMutation({
    mutationFn: async (snapshotId: number) => {
      await apiRequest("DELETE", `/api/sessions/whiteboard/${snapshotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/whiteboard`] });
      toast({
        title: "Tahta Silindi",
        description: "Seçilen tahta görüntüsü başarıyla silindi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Tahta Silinemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: number) => {
      await apiRequest("DELETE", `/api/sessions/recordings/${recordingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}/recordings`] });
      toast({
        title: "Kayıt Silindi",
        description: "Seçilen kayıt başarıyla silindi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Kayıt Silinemedi",
        description: error.message || "Bir hata oluştu.",
        variant: "destructive",
      });
    }
  });
  
  // End session function
  const handleEndSession = async () => {
    try {
      if (!session) return;
      
      await apiRequest("PATCH", `/api/sessions/${sessionId}/status`, {
        status: "completed"
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions`] });
      
      setIsSessionEnded(true);
      
      toast({
        title: "Session ended",
        description: "The session has been successfully completed.",
      });
    } catch (error) {
      toast({
        title: "Error ending session",
        description: "There was a problem ending the session. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Beyaz tahta ve eğitim araçları fonksiyonları
  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool === selectedTool ? null : tool);
    
    toast({
      title: `${tool} aracı açıldı`,
      description: "Şimdi bu araçla çalışabilirsiniz.",
    });
  };
  
  // Beyaz tahta fonksiyonları
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPosition({ x, y });
  };
  
  const finishDrawing = () => {
    setIsDrawing(false);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(currentPosition.x, currentPosition.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setCurrentPosition({ x, y });
  };
  
  const clearWhiteboard = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    toast({
      title: "Beyaz Tahta Temizlendi",
      description: "Tüm çizimler temizlendi."
    });
  };
  
  // Canvas boyutları için useEffect
  useEffect(() => {
    if (canvasRef.current && selectedTool === "whiteboard") {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;
      
      // Canvas boyutlarını container'a göre ayarla
      canvas.width = container.clientWidth;
      canvas.height = 160; // 40px (h-40 sınıfı) height değeri
    }
  }, [selectedTool]);
  
  // Helper functions for classroom tools
  const handleSaveNotes = () => {
    if (noteContent.trim().length === 0) {
      toast({
        title: "Boş not",
        description: "Kaydetmek için önce bir şeyler yazmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Kullanıcı bilgisi alınamadı",
        description: "Oturum bilgileriniz doğrulanamadı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      });
      return;
    }
    
    saveNoteMutation.mutate({
      userId: user.id,
      content: noteContent,
      isPrivate: notePrivate
    });
  };
  
  // File upload function
  const handleFileUpload = () => {
    if (!fileUrl || !fileName || !fileType) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm dosya bilgilerini doldurun.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Kullanıcı bilgisi alınamadı",
        description: "Oturum bilgileriniz doğrulanamadı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      });
      return;
    }
    
    uploadFileMutation.mutate({
      uploadedBy: user.id,
      fileName,
      fileUrl,
      fileType,
      fileSize: fileSize || 0
    });
  };
  
  // Save whiteboard function
  const saveWhiteboard = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/png");
    
    if (!user) {
      toast({
        title: "Kullanıcı bilgisi alınamadı",
        description: "Oturum bilgileriniz doğrulanamadı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      });
      return;
    }
    
    saveWhiteboardMutation.mutate({
      userId: user.id,
      imageData,
      title: `Tahta - ${new Date().toLocaleTimeString()}`
    });
  };
  
  // Add recording function
  const handleAddRecording = () => {
    if (!recordingUrl) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen kayıt URL'sini girin.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Kullanıcı bilgisi alınamadı",
        description: "Oturum bilgileriniz doğrulanamadı. Lütfen tekrar giriş yapın.",
        variant: "destructive",
      });
      return;
    }
    
    saveRecordingMutation.mutate({
      userId: user.id,
      recordingUrl,
      duration: recordingDuration
    });
  };
  
  // Check if user is authorized to join this session
  const isAuthorized = () => {
    if (!user || !session) return false;
    console.log("Auth check:", { userId: user.id, teacherId: session.teacherId, studentId: session.studentId });
    return user.id === session.teacherId || user.id === session.studentId;
  };
  
  // Session güvenli erişimi için yardımcı fonksiyon
  const safeSession = (session: Session | undefined): Session => {
    if (!session) {
      return {
        id: 0,
        teacherId: "",
        studentId: "",
        teacherName: "",
        studentName: "",
        subjectId: 0,
        subjectName: "",
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: "scheduled",
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return session;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-neutral-medium">Loading classroom...</p>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Session Not Found</h2>
        <p className="text-neutral-medium mb-4">The session you're looking for could not be found.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (!isAuthorized()) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Unauthorized Access</h2>
        <p className="text-neutral-medium mb-4">You don't have permission to join this session.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if (session && session.status === "cancelled") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Session Cancelled</h2>
        <p className="text-neutral-medium mb-4">This session has been cancelled.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  if ((session && session.status === "completed") || isSessionEnded) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-heading font-semibold mb-2">Session Completed</h2>
        <p className="text-neutral-medium mb-4">This session has ended.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Üst bilgi ve kontrol alanı */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Aktif Ders</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">
              {safeSession(session).subjectName} <span className="text-primary">Dersi</span>
            </h1>
            <p className="text-neutral-600">
              {user?.id === safeSession(session).teacherId 
                ? `${safeSession(session).studentName} ile eğitim oturumu`
                : `${safeSession(session).teacherName} ile eğitim oturumu`
              }
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="rounded-full border-neutral-200 hover:bg-neutral-50 transition-all duration-300"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Çıkış
            </Button>
            
            {user?.id === safeSession(session).teacherId && (
              <Button 
                variant="destructive" 
                onClick={handleEndSession}
                className="rounded-full transition-all duration-300 hover:scale-105"
              >
                Dersi Bitir
              </Button>
            )}
          </div>
        </div>
        
        {/* Ana içerik alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Video alanı ve interaktif özellikler */}
          <div className="lg:col-span-8 space-y-6">
            {/* Video alanı */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-1 flex items-center">
                      <span className="inline-block h-2 w-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                      Canlı Video Bağlantısı
                    </h2>
                    <p className="text-neutral-500 text-sm">
                      {format(new Date(safeSession(session).startTime), "d MMMM yyyy, HH:mm")} - 
                      {format(new Date(safeSession(session).endTime), " HH:mm")}
                    </p>
                  </div>
                  
                  <div className="bg-primary/5 text-primary text-sm px-3 py-1 rounded-full font-medium">
                    {safeSession(session).status === "scheduled" ? "Planlı" : 
                     safeSession(session).status === "active" ? "Devam Ediyor" : 
                     safeSession(session).status === "completed" ? "Tamamlandı" : "İptal Edildi"}
                  </div>
                </div>
              </div>
              
              <div className="h-[400px]">
                <VideoCall 
                  sessionId={sessionId.toString()} 
                  teacherName={safeSession(session).teacherName} 
                  studentName={safeSession(session).studentName}
                  onEndCall={user?.id === safeSession(session).teacherId ? handleEndSession : undefined}
                />
              </div>
            </div>
            
            {/* İnteraktif öğrenme araçları */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 p-0">
              <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="p-6 border-b border-neutral-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Eğitim Araçları</h2>
                  </div>
                  
                  <TabsList className="grid grid-cols-4 mb-0">
                    <TabsTrigger value="notes" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Notlar
                    </TabsTrigger>
                    <TabsTrigger value="whiteboard" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                        <path d="M2 3h20"></path>
                        <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path>
                        <path d="m7 21 5-5 5 5"></path>
                      </svg>
                      Beyaz Tahta
                    </TabsTrigger>
                    <TabsTrigger value="files" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                      </svg>
                      Dosyalar
                    </TabsTrigger>
                    <TabsTrigger value="recordings" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      Kayıtlar
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Notlar Sekmesi */}
                <TabsContent value="notes" className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Notlar</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => { setNoteContent(""); setNotePrivate(false); }}
                        >
                          <PlusCircle size={16} />
                          Yeni Not
                        </Button>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-gray-50 mb-4">
                        <Textarea
                          placeholder="Ders notunuzu buraya yazın..."
                          className="min-h-[150px] bg-white mb-2"
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id="privateNote" 
                              checked={notePrivate}
                              onChange={(e) => setNotePrivate(e.target.checked)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="privateNote" className="text-sm text-gray-700">
                              Özel not (sadece siz göreceksiniz)
                            </label>
                          </div>
                          <Button onClick={handleSaveNotes} size="sm" className="flex items-center gap-2">
                            <Save size={16} />
                            Kaydet
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-4">Kaydedilen Notlar</h3>
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        {notes.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Henüz not eklenmemiş</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {notes.map((note) => (
                              <div key={note.id} className="border rounded-md p-3 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex gap-2 items-center">
                                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                                      {note.userName ? note.userName.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{note.userName || 'Kullanıcı'}</p>
                                      <p className="text-xs text-gray-500">
                                        {format(new Date(note.createdAt), "d MMM yyyy, HH:mm")}
                                        {note.isPrivate && " (Özel)"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {user?.id === note.userId && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-gray-500"
                                      onClick={() => deleteNoteMutation.mutate(note.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Beyaz Tahta Sekmesi */}
                <TabsContent value="whiteboard" className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Beyaz Tahta</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setStrokeColor("#000000")}
                            className="h-8 w-8 p-0 rounded-full"
                            style={{ background: strokeColor === "#000000" ? "#f1f5f9" : "white" }}
                          >
                            <div className="w-4 h-4 bg-black rounded-full"></div>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setStrokeColor("#ff0000")}
                            className="h-8 w-8 p-0 rounded-full"
                            style={{ background: strokeColor === "#ff0000" ? "#f1f5f9" : "white" }}
                          >
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setStrokeColor("#0000ff")}
                            className="h-8 w-8 p-0 rounded-full"
                            style={{ background: strokeColor === "#0000ff" ? "#f1f5f9" : "white" }}
                          >
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearWhiteboard}
                          >
                            Temizle
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={saveWhiteboard}
                          >
                            <Save size={16} className="mr-2" />
                            Kaydet
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-gray-50">
                        <canvas 
                          ref={canvasRef}
                          className="w-full h-[300px] bg-white border rounded"
                          onMouseDown={startDrawing}
                          onMouseUp={finishDrawing}
                          onMouseOut={finishDrawing}
                          onMouseMove={draw}
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-4">Kaydedilen Görüntüler</h3>
                      <ScrollArea className="h-[372px] rounded-md border p-4">
                        {whiteboardSnapshots.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Henüz görüntü kaydedilmemiş</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {whiteboardSnapshots.map((snapshot) => (
                              <div key={snapshot.id} className="border rounded-md p-3 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex gap-2 items-center">
                                    <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                      {snapshot.userName ? snapshot.userName.charAt(0) : 'U'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{snapshot.title}</p>
                                      <p className="text-xs text-gray-500">{format(new Date(snapshot.createdAt), "d MMM yyyy, HH:mm")}</p>
                                    </div>
                                  </div>
                                  
                                  {user?.id === snapshot.userId && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-gray-500"
                                      onClick={() => deleteWhiteboardMutation.mutate(snapshot.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  )}
                                </div>
                                <div className="border rounded overflow-hidden my-2">
                                  <img src={snapshot.imageData} alt={snapshot.title} className="w-full h-auto" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Dosyalar Sekmesi */}
                <TabsContent value="files" className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Dosya Paylaşımı</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setIsFileDialogOpen(true)}
                        >
                          <Upload size={16} />
                          Dosya Yükle
                        </Button>
                      </div>
                      
                      <div className="border rounded-md p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[150px]">
                        <div className="bg-emerald-100 p-3 rounded-full mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        </div>
                        <p className="text-gray-700 mb-1">Ders materyallerinizi paylaşın</p>
                        <p className="text-sm text-gray-500 mb-3">PDF, Word, Excel, PowerPoint ve diğer dosyalar</p>
                        <Button onClick={() => setIsFileDialogOpen(true)}>Dosya Yükle</Button>
                      </div>
                      
                      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Dosya Yükle</DialogTitle>
                            <DialogDescription>
                              Paylaşmak istediğiniz dosya bilgilerini girin
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="fileName">Dosya Adı</Label>
                              <Input
                                id="fileName"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="Örnek: Matematik Ders Notu.pdf"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="fileUrl">Dosya URL</Label>
                              <Input
                                id="fileUrl"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="https://example.com/dosya.pdf"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="fileType">Dosya Türü</Label>
                                <Input
                                  id="fileType"
                                  value={fileType}
                                  onChange={(e) => setFileType(e.target.value)}
                                  placeholder="PDF, DOCX, vb."
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="fileSize">Dosya Boyutu (KB)</Label>
                                <Input
                                  id="fileSize"
                                  type="number"
                                  value={fileSize || ""}
                                  onChange={(e) => setFileSize(parseInt(e.target.value) || 0)}
                                  placeholder="1024"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>İptal</Button>
                            <Button onClick={handleFileUpload}>Yükle</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-4">Paylaşılan Dosyalar</h3>
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        {files.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Henüz dosya paylaşılmamış</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {files.map((file) => (
                              <div key={file.id} className="flex items-center border rounded-md p-3 bg-white">
                                <div className="bg-emerald-100 p-2 rounded mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                    <polyline points="13 2 13 9 20 9"></polyline>
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <p className="font-medium text-sm">{file.fileName}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.fileSize / 1024).toFixed(1)} MB
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                      {file.fileType} · {format(new Date(file.uploadedAt), "d MMM")}
                                    </p>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-500 hover:text-primary"
                                        asChild
                                      >
                                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                          <Download size={14} />
                                        </a>
                                      </Button>
                                      
                                      {user?.id === file.uploadedBy && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-500 hover:text-red-500"
                                          onClick={() => deleteFileMutation.mutate(file.id)}
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Kayıtlar Sekmesi */}
                <TabsContent value="recordings" className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Oturum Kayıtları</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setIsRecordingDialogOpen(true)}
                        >
                          <PlusCircle size={16} />
                          Kayıt Ekle
                        </Button>
                      </div>
                      
                      <div className="border rounded-md p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[150px]">
                        <div className="bg-rose-100 p-3 rounded-full mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="10 8 16 12 10 16 10 8"></polygon>
                          </svg>
                        </div>
                        <p className="text-gray-700 mb-1">Oturum kayıtlarına erişin</p>
                        <p className="text-sm text-gray-500 mb-3">Kaçırdığınız derslere sonra göz atabilirsiniz</p>
                        <Button onClick={() => setIsRecordingDialogOpen(true)}>Kayıt Ekle</Button>
                      </div>
                      
                      <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Kayıt Ekle</DialogTitle>
                            <DialogDescription>
                              Ders kaydı URL'sini ve süresini girin
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="recordingUrl">Kayıt URL</Label>
                              <Input
                                id="recordingUrl"
                                value={recordingUrl}
                                onChange={(e) => setRecordingUrl(e.target.value)}
                                placeholder="https://example.com/recording.mp4"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="recordingDuration">Süre (dakika)</Label>
                              <Input
                                id="recordingDuration"
                                type="number"
                                value={recordingDuration || ""}
                                onChange={(e) => setRecordingDuration(parseInt(e.target.value) || 0)}
                                placeholder="45"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRecordingDialogOpen(false)}>İptal</Button>
                            <Button onClick={handleAddRecording}>Ekle</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-4">Eklenen Kayıtlar</h3>
                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        {recordings.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>Henüz kayıt eklenmemiş</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {recordings.map((recording) => (
                              <div key={recording.id} className="border rounded-md p-3 bg-white">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-rose-100 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polygon points="10 8 16 12 10 16 10 8"></polygon>
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between">
                                      <p className="font-medium text-sm">Ders Kaydı</p>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Clock size={12} className="mr-1" />
                                        {recording.duration} dakika
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {format(new Date(recording.createdAt), "d MMM yyyy, HH:mm")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8"
                                    asChild
                                  >
                                    <a href={recording.recordingUrl} target="_blank" rel="noopener noreferrer">
                                      İzle
                                    </a>
                                  </Button>
                                  
                                  {user?.id === recording.userId && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-gray-500 hover:text-red-500"
                                      onClick={() => deleteRecordingMutation.mutate(recording.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Beyaz Tahta */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                      <path d="M2 3h20"></path>
                      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path>
                      <path d="m7 21 5-5 5 5"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Beyaz Tahta</h3>
                    <p className="text-xs text-neutral-500">Ortak çizim ve açıklama</p>
                  </div>
                </div>
                <Button 
                  className="w-full justify-start bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium"
                  onClick={() => handleToolSelect('whiteboard')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 5v14"></path>
                    <path d="M5 12h14"></path>
                  </svg>
                  Yeni Tahta Oluştur
                </Button>
                
                {selectedTool === 'whiteboard' && (
                  <div className="mt-4 border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium">Beyaz Tahta Alanı</h4>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setStrokeColor("#000000")}
                          className="h-7 w-7 p-0"
                        >
                          <div className="w-4 h-4 bg-black rounded-full"></div>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setStrokeColor("#ff0000")}
                          className="h-7 w-7 p-0"
                        >
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setStrokeColor("#0000ff")}
                          className="h-7 w-7 p-0"
                        >
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearWhiteboard}
                          className="h-7 px-2 text-xs"
                        >
                          Temizle
                        </Button>
                      </div>
                    </div>
                    
                    <canvas 
                      ref={canvasRef}
                      className="h-40 w-full bg-gray-50 rounded border border-gray-200 cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseUp={finishDrawing}
                      onMouseOut={finishDrawing}
                      onMouseMove={draw}
                    />
                    
                    <div className="flex justify-end mt-3">
                      <Button size="sm" className="text-xs">Kaydet ve Paylaş</Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dosya Paylaşımı */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Dosya Paylaşımı</h3>
                    <p className="text-xs text-neutral-500">Dosya ve belge paylaşımı</p>
                  </div>
                </div>
                <Button 
                  className="w-full justify-start bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium"
                  onClick={handleFileUpload}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" x2="12" y1="3" y2="15"></line>
                  </svg>
                  Dosya Yükle
                </Button>
                
                {sharedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Paylaşılan Dosyalar</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {sharedFiles.map((file, index) => (
                        <div key={index} className="flex items-center bg-gray-50 rounded p-2 text-sm">
                          <div className="bg-emerald-100 p-1.5 rounded mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <path d="M14 2v6h6"></path>
                              <path d="M16 13H8"></path>
                              <path d="M16 17H8"></path>
                              <path d="M10 9H8"></path>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-xs">{file.name}</p>
                            <p className="text-xs text-neutral-500">{file.type}, {file.size}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" x2="12" y1="15" y2="3"></line>
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Yan panel - Oturum bilgileri ve araçlar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Oturum bilgileri */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-5 border-b border-neutral-100">
                <h3 className="font-semibold text-lg">Ders Bilgileri</h3>
              </div>
              
              <div className="p-5 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Konu</h4>
                    <p className="text-lg font-medium">{session.subjectName}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-50 p-2.5 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 21a8 8 0 0 0-16 0"></path>
                      <circle cx="10" cy="8" r="5"></circle>
                      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">
                      {user?.id === session.teacherId ? "Öğrenci" : "Öğretmen"}
                    </h4>
                    <p className="text-lg font-medium">
                      {user?.id === session.teacherId ? session.studentName : session.teacherName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-50 p-2.5 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                      <line x1="16" x2="16" y1="2" y2="6"></line>
                      <line x1="8" x2="8" y1="2" y2="6"></line>
                      <line x1="3" x2="21" y1="10" y2="10"></line>
                      <path d="M8 14h.01"></path>
                      <path d="M12 14h.01"></path>
                      <path d="M16 14h.01"></path>
                      <path d="M8 18h.01"></path>
                      <path d="M12 18h.01"></path>
                      <path d="M16 18h.01"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Tarih</h4>
                    <p className="text-lg font-medium">{format(new Date(session.startTime), "d MMMM yyyy")}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-amber-50 p-2.5 text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500">Saat</h4>
                    <p className="text-lg font-medium">
                      {format(new Date(session.startTime), "HH:mm")} - 
                      {format(new Date(session.endTime), " HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Öğretmen Araçları */}
            {user?.id === session.teacherId && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-5 border-b border-neutral-100">
                  <h3 className="font-semibold text-lg">Öğretmen Araçları</h3>
                  <p className="text-sm text-neutral-500 mt-1">Öğrenciye yardımcı olabilecek ek araçlar</p>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Button className="flex items-center justify-start text-left py-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="bg-primary-dark/10 rounded-full p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-dark">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                          <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"></path>
                          <path d="M8 10h8"></path>
                          <path d="M8 14h8"></path>
                          <path d="M8 18h8"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium mb-0.5">Sınav Gönder</h4>
                        <p className="text-xs text-neutral-500">Öğrenciye özel sınav ata</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center justify-start text-left py-6 rounded-xl border-neutral-200 transition-all duration-300">
                      <div className="bg-blue-50 rounded-full p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"></path>
                          <path d="M13 2v7h7"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium mb-0.5">Notları Paylaş</h4>
                        <p className="text-xs text-neutral-500">Ders notlarını gönder</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center justify-start text-left py-6 rounded-xl border-neutral-200 transition-all duration-300">
                      <div className="bg-amber-50 rounded-full p-2.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" x2="12" y1="16" y2="12"></line>
                          <line x1="12" x2="12.01" y1="8" y2="8"></line>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium mb-0.5">İlerleme Durumu</h4>
                        <p className="text-xs text-neutral-500">Öğrenci gelişimini kaydet</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Öğrenci ise, kaynaklar */}
            {user?.id === session.studentId && (
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-5 border-b border-neutral-100">
                  <h3 className="font-semibold text-lg">Ders Kaynakları</h3>
                  <p className="text-sm text-neutral-500 mt-1">Öğretmeninizin paylaştığı kaynaklar</p>
                </div>
                
                <div className="p-5">
                  <div className="text-center py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-neutral-300 mb-3">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"></path>
                      <path d="M13 2v7h7"></path>
                    </svg>
                    <p className="text-neutral-500">Henüz paylaşılan bir kaynak bulunmuyor</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Ders süresi */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-md overflow-hidden">
              <div className="p-5 text-white">
                <h3 className="font-semibold text-lg text-white/90">Kalan Süre</h3>
                <div className="mt-3 flex items-center justify-center py-4">
                  <div className="text-5xl font-bold">45:00</div>
                </div>
                <p className="text-center text-white/70 text-sm">
                  Toplam ders süresi: 60 dakika
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
