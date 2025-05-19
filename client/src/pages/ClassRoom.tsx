import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoCall } from "@/components/ui/video-call";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeftIcon } from "lucide-react";
import { format } from "date-fns";

export default function ClassRoom() {
  const [, params] = useRoute("/classroom/:id");
  const sessionId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  
  // Fetch session details
  const { data: session, isLoading } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
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
  
  // Check if user is authorized to join this session
  const isAuthorized = () => {
    if (!user || !session) return false;
    return user.id === session.teacherId || user.id === session.studentId;
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
  
  if (session.status === "cancelled") {
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
  
  if (session.status === "completed" || isSessionEnded) {
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
              {session.subjectName} <span className="text-primary">Dersi</span>
            </h1>
            <p className="text-neutral-600">
              {user?.id === session.teacherId 
                ? `${session.studentName} ile eğitim oturumu`
                : `${session.teacherName} ile eğitim oturumu`
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
            
            {user?.id === session.teacherId && (
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
                      {format(new Date(session.startTime), "d MMMM yyyy, HH:mm")} - 
                      {format(new Date(session.endTime), " HH:mm")}
                    </p>
                  </div>
                  
                  <div className="bg-primary/5 text-primary text-sm px-3 py-1 rounded-full font-medium">
                    {session.status === "scheduled" ? "Planlı" : 
                     session.status === "active" ? "Devam Ediyor" : 
                     session.status === "completed" ? "Tamamlandı" : "İptal Edildi"}
                  </div>
                </div>
              </div>
              
              <div className="h-[400px]">
                <VideoCall 
                  sessionId={sessionId.toString()} 
                  teacherName={session.teacherName} 
                  studentName={session.studentName}
                  onEndCall={user?.id === session.teacherId ? handleEndSession : undefined}
                />
              </div>
            </div>
            
            {/* İnteraktif öğrenme araçları */}
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
                <Button className="w-full justify-start bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M12 5v14"></path>
                    <path d="M5 12h14"></path>
                  </svg>
                  Yeni Tahta Oluştur
                </Button>
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
                <Button className="w-full justify-start bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" x2="12" y1="3" y2="15"></line>
                  </svg>
                  Dosya Yükle
                </Button>
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
