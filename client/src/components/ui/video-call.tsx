import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneOffIcon, MessagesSquareIcon, ScreenShareIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VideoCallProps {
  sessionId: number;
  isTeacher: boolean;
  isSessionActive: boolean;
  onEndCall?: () => void;
}

export function VideoCall({ sessionId, isTeacher, isSessionActive, onEndCall }: VideoCallProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: "Sistem", text: "Hoş geldiniz! Nasılsınız?", time: "Şimdi" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Session bilgilerini çekme
  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSessionInfo(data);
        }
      } catch (error) {
        console.error("Session bilgisi alınamadı:", error);
      }
    };
    
    if (sessionId) {
      fetchSessionInfo();
    }
  }, [sessionId]);
  
  // Basitleştirilmiş kamera erişimi - tek seferlik
  useEffect(() => {
    // Bekleme ekranı göster
    const showPlaceholder = (videoRef: React.RefObject<HTMLVideoElement>, label: string) => {
      if (!videoRef.current) return;
      
      // Sadece arka plan rengini ayarla, geriye kalan herşeyi CSS ile yönet
      videoRef.current.poster = `data:image/svg+xml,
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
          <rect width="640" height="480" fill="#3b82f6"/>
          <text x="320" y="240" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${label}</text>
        </svg>`;
    };
    
    if (!isSessionActive) {
      showPlaceholder(localVideoRef, "Siz");
      showPlaceholder(remoteVideoRef, isTeacher ? "Öğrenci" : "Öğretmen");
      return;
    }
    
    // Geliştirilmiş kamera erişimi
    const setupCamera = async () => {
      try {
        // Önce kullanıcıdan izin kontrolü
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Tarayıcınız kamera ve mikrofon erişimini desteklemiyor");
        }
        
        console.log("Kamera erişimi başarılı");
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setLocalStream(stream);
        setIsMicActive(true);
        setCameraActive(true);
        
        // Karşı taraf için placeholder göster
        showPlaceholder(remoteVideoRef, isTeacher ? "Öğrenci" : "Öğretmen");
      } catch (err) {
        console.error("Kamera erişimi hatası:", err);
        
        // Eğer kullanıcı izin vermezse burada bilgilendirme göster
        setMicError("Mikrofon erişimi sağlanamadı. İzinleri kontrol edin.");
        setCameraError("Kamera erişimi sağlanamadı. İzinleri kontrol edin.");
        
        showPlaceholder(localVideoRef, "Siz (Kamera erişilemedi)");
        showPlaceholder(remoteVideoRef, isTeacher ? "Öğrenci" : "Öğretmen");
      }
    };
    
    setupCamera();
    
    return () => {
      // Medya izinlerini temizle
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [isSessionActive, isTeacher]);
  
  // Ses açma/kapatma - geliştirilmiş
  const toggleAudio = () => {
    try {
      // Eğer stream yoksa uyarı ver ve işleme devam etme
      if (!localStream) {
        toast({
          title: "Mikrofon Erişimi Yok",
          description: "Mikrofon erişimi sağlanamadı. İzinleri kontrol edin.",
          variant: "destructive"
        });
        return;
      }
      
      const audioTracks = localStream.getAudioTracks();
      
      // Ses track olmayabilir
      if (audioTracks.length === 0) {
        toast({
          title: "Mikrofon Bulunmadı",
          description: "Aktif bir mikrofon bulunamadı.",
          variant: "destructive"
        });
        return;
      }
      
      // Ses durumunu değiştir
      audioTracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      
      // State güncelle
      setIsAudioEnabled(!isAudioEnabled);
      
      toast({
        title: isAudioEnabled ? "Mikrofon Kapatıldı" : "Mikrofon Açıldı",
        description: isAudioEnabled ? "Sesiniz karşı tarafa iletilmiyor" : "Sesiniz karşı tarafa iletiliyor",
      });
    } catch (error) {
      console.error("Mikrofon açma/kapama hatası:", error);
      toast({
        title: "Mikrofon Hatası",
        description: "Mikrofon açma/kapama işlemi başarısız oldu.",
        variant: "destructive"
      });
    }
  };
  
  // Video açma/kapatma - geliştirilmiş sürüm
  const toggleVideo = () => {
    try {
      // Eğer stream yoksa uyarı ver ve işleme devam etme
      if (!localStream) {
        toast({
          title: "Kamera Erişimi Yok",
          description: "Kamera erişimi sağlanamadı. İzinleri kontrol edin.",
          variant: "destructive"
        });
        return;
      }
      
      const videoTracks = localStream.getVideoTracks();
      
      // Video track olmayabilir
      if (videoTracks.length === 0) {
        toast({
          title: "Kamera Bulunmadı",
          description: "Aktif bir kamera bulunamadı.",
          variant: "destructive"
        });
        return;
      }
      
      // Video durumunu değiştir
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      
      // State güncelle
      setIsVideoEnabled(!isVideoEnabled);
      
      toast({
        title: isVideoEnabled ? "Kamera Kapatıldı" : "Kamera Açıldı",
        description: isVideoEnabled ? "Görüntünüz karşı tarafa iletilmiyor" : "Görüntünüz karşı tarafa iletiliyor",
      });
    } catch (error) {
      console.error("Kamera açma/kapama hatası:", error);
      toast({
        title: "Kamera Hatası",
        description: "Kamera açma/kapama işlemi başarısız oldu.",
        variant: "destructive"
      });
    }
  };
  
  // Ultra basitleştirilmiş ekran paylaşımı
  const toggleScreenShare = async () => {
    // İstekte bulunmadan önce toast mesajı göster
    if (!isScreenSharing) {
      toast({
        title: "Ekran paylaşımı isteniyor",
        description: "Lütfen paylaşmak istediğiniz ekranı seçin"
      });
    }
    
    try {
      if (isScreenSharing) {
        // Eğer ekran paylaşımı yapılıyorsa, kapat
        try {
          // Önce streami durdur
          if (localStream) {
            localStream.getTracks().forEach(track => {
              track.stop();
            });
          }
          
          // Kameraya geri dön
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = videoStream;
          }
          
          setLocalStream(videoStream);
          setIsScreenSharing(false);
          
          toast({
            title: "Kameraya geri dönüldü"
          });
        } catch (err) {
          console.error("Kameraya dönüş hatası:", err);
          
          // Video referansını temizle
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
          
          setIsScreenSharing(false);
          
          // Bekleme ekranı göster
          if (localVideoRef.current) {
            localVideoRef.current.poster = `data:image/svg+xml,
              <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
                <rect width="640" height="480" fill="#3b82f6"/>
                <text x="320" y="240" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Kamera erişilemiyor</text>
              </svg>`;
          }
        }
      } else {
        // Ekran paylaşımını başlat
        try {
          const displayMedia = await navigator.mediaDevices.getDisplayMedia({
            video: true
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = displayMedia;
          }
          
          // Kullanıcı ekran paylaşımını durdurursa
          displayMedia.getVideoTracks()[0].onended = async () => {
            setIsScreenSharing(false);
            
            // Kameraya dönmeyi dene
            try {
              const videoStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
              });
              
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = videoStream;
              }
              
              setLocalStream(videoStream);
            } catch (error) {
              console.error("Kameraya dönüş hatası:", error);
              
              if (localVideoRef.current) {
                localVideoRef.current.poster = `data:image/svg+xml,
                  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
                    <rect width="640" height="480" fill="#3b82f6"/>
                    <text x="320" y="240" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Siz</text>
                  </svg>`;
              }
            }
          };
          
          // Akışı sakla
          setLocalStream(displayMedia);
          setIsScreenSharing(true);
          
          toast({
            title: "Ekran paylaşılıyor"
          });
        } catch (err) {
          // İzin verilmezse ya da paylaşım iptal edilirse
          console.error("Ekran paylaşımı başlatılamadı:", err);
          
          toast({
            title: "Ekran paylaşımı iptal edildi",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error("Genel hata:", err);
    }
  };
  
  // Geliştirilmiş sohbet mesajı gönderme
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Boş mesaj kontrolü
    if (!newMessage.trim()) return;
    
    try {
      // Formatlanmış zaman
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      // Yeni mesaj objesi
      const newMessageObj = {
        sender: "Siz", 
        text: newMessage.trim(),
        time: timeString
      };
      
      // State güncelleme - eski array'i referans ile değil, kopya oluşturarak güncelle
      const updatedMessages = [...messages, newMessageObj];
      setMessages(updatedMessages);
      
      // Input temizle
      setNewMessage("");
      
      // Otomatik scroll
      setTimeout(() => {
        const chatContainer = document.querySelector('.flex-grow.p-3.overflow-y-auto.bg-white');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 50);
      
      // Demo cevap mesajını kaldırdık
      // Gerçek bir entegrasyon için burada WebSocket veya başka bir protokol kullanılabilir
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      
      toast({
        title: "Mesaj Gönderilemedi",
        description: "Lütfen tekrar deneyiniz.",
        variant: "destructive"
      });
    }
  };
  
  // Dersi sonlandır
  const handleEndCall = async () => {
    if (window.confirm("Dersi sonlandırmak istediğinize emin misiniz?")) {
      // Medya kaynaklarını durdur
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Session durumunu güncelle
      try {
        await apiRequest("PATCH", `/api/sessions/${sessionId}/status`, { 
          status: "completed" 
        });
        
        toast({
          title: "Ders Sonlandırıldı",
          description: "Ders başarıyla tamamlandı",
        });
        
        // Dashboard sayfasına yönlendir
        window.location.href = isTeacher ? "/teacher-dashboard" : "/student-dashboard";
        
        // Callback'i çağır
        if (onEndCall) {
          onEndCall();
        }
      } catch (error) {
        console.error("Ders sonlandırma hatası:", error);
        toast({
          title: "Ders Sonlandırma Hatası",
          description: "Ders sonlandırılırken bir sorun oluştu",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Video görüşme ana kısmı - Optimize edilmiş */}
      <div className="flex-grow flex flex-col sm:grid sm:grid-cols-12 gap-3 p-3 h-full">
        {/* Ana video alanı - Daha net bir görüntü için */}
        <div className={`${isChatOpen ? 'sm:col-span-8' : 'sm:col-span-12'} flex flex-col h-full`}>
          {/* Büyük video ekranı */}
          <div className="w-full relative flex-grow bg-gray-900 rounded overflow-hidden border border-gray-200 shadow-md">
            <video 
              ref={remoteVideoRef}
              className="w-full h-full object-contain" 
              autoPlay 
              playsInline
              style={{ width: '100%', height: '100%', minHeight: '300px', maxHeight: '70vh', background: '#1e293b' }}
            />
            
            <div className="absolute top-2 left-2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                {isTeacher 
                  ? sessionInfo?.studentName 
                    ? `${sessionInfo.studentName} (Öğrenci)` 
                    : "Öğrenci" 
                  : sessionInfo?.teacherName 
                    ? `${sessionInfo.teacherName} (Öğretmen)` 
                    : "Öğretmen"
                }
              </div>
            </div>
            
            {/* Büyük, belirgin kendi video penceremiz */}
            <div className="absolute bottom-4 right-4 rounded-md overflow-hidden shadow-lg border border-gray-100" style={{ width: '180px', height: '130px', background: '#0f172a' }}>
              <video 
                ref={localVideoRef} 
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white text-center">
                {isScreenSharing ? "Ekran Paylaşımı" : "Siz"}
              </div>
              
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <VideoOffIcon className="h-6 w-6 text-white/60" /> 
                </div>
              )}
            </div>
            
            {/* Video durumu gösterge */}
            {isScreenSharing && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded-full animate-pulse">
                Ekran Paylaşılıyor
              </div>
            )}
          </div>
          
          {/* Kontrol butonları - Daha büyük ve kullanışlı */}
          <div className="flex flex-wrap gap-2 justify-center items-center mt-3">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              onClick={toggleAudio}
              className="flex items-center px-4 py-2"
              size="sm"
            >
              {isAudioEnabled 
                ? <MicIcon className="h-4 w-4 mr-2" /> 
                : <MicOffIcon className="h-4 w-4 mr-2" />
              }
              {isAudioEnabled ? "Mikrofon: Açık" : "Mikrofon: Kapalı"}
            </Button>
            
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              onClick={toggleVideo}
              className="flex items-center px-4 py-2"
              size="sm"
            >
              {isVideoEnabled 
                ? <VideoIcon className="h-4 w-4 mr-2" /> 
                : <VideoOffIcon className="h-4 w-4 mr-2" />
              }
              {isVideoEnabled ? "Kamera: Açık" : "Kamera: Kapalı"}
            </Button>
            
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              onClick={toggleScreenShare}
              className="flex items-center px-4 py-2"
              size="sm"
            >
              <ScreenShareIcon className="h-4 w-4 mr-2" />
              Ekran Paylaş
            </Button>
            
            <Button
              variant={isChatOpen ? "default" : "outline"}
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center px-4 py-2 relative"
              size="sm"
            >
              <MessagesSquareIcon className="h-4 w-4 mr-2" />
              Sohbet
              {messages.length > 1 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Button>
            
            {isSessionActive && (
              <Button
                variant="destructive"
                onClick={handleEndCall}
                className="flex items-center px-4 py-2"
                size="sm"
              >
                <PhoneOffIcon className="h-4 w-4 mr-2" />
                Dersi Bitir
              </Button>
            )}
          </div>
        </div>
        
        {/* Sohbet paneli - daha basit ve anlaşılır */}
        {isChatOpen && (
          <div className="sm:col-span-4 flex flex-col h-full border rounded shadow-sm">
            <div className="bg-gray-100 border-b px-3 py-2">
              <h3 className="text-sm font-medium">Ders Sohbeti</h3>
            </div>
            
            <div className="flex-grow p-3 overflow-y-auto bg-white space-y-3">
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${message.sender === "Siz" ? "items-end" : "items-start"}`}
                >
                  <div className="inline-flex items-center text-xs mb-1 text-gray-500">
                    <span>{message.sender}</span>
                    <span className="mx-1">•</span>
                    <span>{message.time}</span>
                  </div>
                  
                  <div 
                    className={`px-3 py-2 rounded-lg max-w-[85%] ${
                      message.sender === "Siz" 
                        ? "bg-primary text-white" 
                        : "bg-gray-100"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="p-2 border-t flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-grow px-3 py-1 text-sm border rounded-l outline-none focus:ring-1 focus:ring-primary"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={!newMessage.trim()}
                className="rounded-l-none"
              >
                Gönder
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}