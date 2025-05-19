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
  
  // Kamera ve mikrofon erişimi - Basitleştirilmiş sürüm
  useEffect(() => {
    // Eğer oturum aktif değilse kamera erişimi sağlama
    if (!isSessionActive) {
      // Sadece canvas arka planı oluştur
      createCanvasBackground(localVideoRef, "Siz");
      createCanvasBackground(remoteVideoRef, isTeacher ? "Öğrenci" : "Öğretmen");
      return;
    }
    
    // Kamera erişimi için basit bir yaklaşım
    const setupCamera = () => {
      try {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            console.log("Kamera erişimi başarılı");
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(err => console.error("Video oynatma hatası:", err));
            }
            setLocalStream(stream);
            
            toast({
              title: "Kamera Bağlandı",
              description: "Görüntülü görüşme başlatıldı",
            });
          })
          .catch(err => {
            console.error("Kamera erişim hatası:", err);
            toast({
              title: "Kamera Erişimi Sağlanamadı",
              description: "Tarayıcı izinlerini kontrol edin",
              variant: "destructive",
            });
            
            // Kamera erişimi olmadığında arka plan göster
            createCanvasBackground(localVideoRef, "Siz");
          });
        
        // Demo için karşı taraf arka planı
        createCanvasBackground(remoteVideoRef, isTeacher ? "Öğrenci" : "Öğretmen");
      } catch (error) {
        console.error("Kamera kurulum hatası:", error);
        // Hata durumunda canvas arka planları göster
        createCanvasBackground(localVideoRef, "Siz");
        createCanvasBackground(remoteVideoRef, isTeacher ? "Öğrenci" : "Öğretmen");
      }
    };

    setupCamera();
    
    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [isSessionActive, isTeacher, toast]);
  
  // Canvas arka plan oluşturma - basitleştirilmiş ve iyileştirilmiş
  const createCanvasBackground = (videoRef: React.RefObject<HTMLVideoElement>, label: string) => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 320;  // Daha küçük boyut performans için
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Mavi gradient arka plan
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1e40af');
      
      function drawFrame() {
        if (!videoRef.current) return;
        
        // Arka planı çiz
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Merkez daire
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Kullanıcı etiketi
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2);
        
        // Canvas'ı video kaynağı olarak ayarla
        videoRef.current.srcObject = canvas.captureStream(30); // 30fps
        
        // Kendini tekrar çağır (animasyon için)
        requestAnimationFrame(drawFrame);
      }
      
      // İlk frame'i çiz
      drawFrame();
    }
  };
  
  // Ses açma/kapatma
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      
      toast({
        title: isAudioEnabled ? "Mikrofon Kapatıldı" : "Mikrofon Açıldı",
        description: isAudioEnabled ? "Sesiniz karşı tarafa iletilmiyor" : "Sesiniz karşı tarafa iletiliyor",
      });
    }
  };
  
  // Video açma/kapatma 
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      
      toast({
        title: isVideoEnabled ? "Kamera Kapatıldı" : "Kamera Açıldı",
        description: isVideoEnabled ? "Görüntünüz karşı tarafa iletilmiyor" : "Görüntünüz karşı tarafa iletiliyor",
      });
    }
  };
  
  // Ekran paylaşımı - basitleştirilmiş
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Ekran paylaşımını durdur ve kamera görüntüsüne geri dön
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        
        // Kameraya geri dön
        const cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
        }
        
        setLocalStream(cameraStream);
        setIsScreenSharing(false);
        
        toast({
          title: "Ekran Paylaşımı Durduruldu",
          description: "Kamera görüntüsüne geri dönüldü"
        });
      } else {
        // Ekran paylaşımını başlat
        try {
          const displayMedia = await navigator.mediaDevices.getDisplayMedia({ 
            video: { cursor: "always" },
            audio: false
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = displayMedia;
          }
          
          // Ses kanalını koru
          if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
              displayMedia.addTrack(audioTracks[0].clone());
            }
          }
          
          // Kullanıcı tarayıcı UI'dan paylaşımı durdurursa
          displayMedia.getVideoTracks()[0].onended = () => {
            toggleScreenShare();
          };
          
          setLocalStream(displayMedia);
          setIsScreenSharing(true);
          
          toast({
            title: "Ekran Paylaşımı Başlatıldı",
            description: "Ekranınız diğer katılımcıya gösteriliyor"
          });
        } catch (err) {
          console.error("Ekran paylaşımı hatası:", err);
          toast({
            title: "Ekran Paylaşımı Hatası",
            description: "Lütfen tarayıcı izinlerini kontrol edin",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error("Ekran paylaşımı işlemi hatası:", err);
      toast({
        title: "Ekran Paylaşımı İşlemi Başarısız",
        description: "Bir sorun oluştu, lütfen tekrar deneyin",
        variant: "destructive"
      });
    }
  };
  
  // Sohbet mesajı gönderme
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0");
    
    // Mesajı ekle
    setMessages(prev => [
      ...prev,
      { sender: "Siz", text: newMessage, time },
    ]);
    
    setNewMessage("");
    
    // Demo yanıt
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          sender: isTeacher ? "Öğrenci" : "Öğretmen", 
          text: "Mesajınızı aldım, teşekkürler. Size nasıl yardımcı olabilirim?", 
          time: now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0")
        },
      ]);
    }, 1500);
  };
  
  // Dersi sonlandır
  const handleEndCall = async () => {
    // Medya kaynaklarını durdur
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Session durumunu güncelle
    try {
      await apiRequest("PATCH", `/api/sessions/${sessionId}`, { 
        status: "completed" 
      });
      
      toast({
        title: "Ders Sonlandırıldı",
        description: "Ders başarıyla tamamlandı",
      });
      
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
  };
  
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 flex-grow">
        <div className={`${isChatOpen ? 'md:col-span-2' : 'md:col-span-3'} flex flex-col h-full`}>
          {/* Video alanı - Daha basit ve stabil */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-inner flex-grow">
            {/* Ana video (uzak kullanıcı) */}
            <video 
              ref={remoteVideoRef}
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline
            />
            
            {/* Etiket - diğer kullanıcı */}
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              {isTeacher ? sessionInfo?.studentName || "Öğrenci" : sessionInfo?.teacherName || "Öğretmen"}
            </div>
            
            {/* Yerel video penceresi */}
            <div className="absolute bottom-3 right-3 w-32 h-24 sm:w-40 sm:h-30 border-2 border-white/30 rounded-lg overflow-hidden">
              <video 
                ref={localVideoRef}
                className="w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted 
              />
              
              {/* Etiket - siz */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white">
                Siz {isScreenSharing && "(Ekran Paylaşımı)"}
              </div>
              
              {/* Video kapalı göstergesi */}
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <VideoOffIcon className="h-6 w-6 text-white/70" />
                </div>
              )}
            </div>
          </div>
          
          {/* Video kontrol butonları - Daha basit ve anlaşılır */}
          <div className="flex justify-center items-center gap-3 mt-4">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className="rounded-full h-10 w-10"
            >
              {isAudioEnabled ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className="rounded-full h-10 w-10"
            >
              {isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOffIcon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="icon"
              onClick={toggleScreenShare}
              className="rounded-full h-10 w-10"
            >
              <ScreenShareIcon className="h-5 w-5" />
            </Button>
            
            <Button
              variant={isChatOpen ? "default" : "outline"}
              size="icon"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="rounded-full h-10 w-10 relative"
            >
              <MessagesSquareIcon className="h-5 w-5" />
              {messages.length > 1 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {messages.length - 1}
                </span>
              )}
            </Button>
            
            {isSessionActive && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleEndCall}
                className="rounded-full h-10 w-10"
              >
                <PhoneOffIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Sohbet paneli - daha basit ve anlaşılır */}
        {isChatOpen && (
          <div className="md:col-span-1 flex flex-col border rounded-lg h-full">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-medium text-sm flex items-center">
                <MessagesSquareIcon className="h-4 w-4 mr-2 text-primary" />
                Canlı Sohbet
              </h3>
            </div>
            
            <div className="flex-grow p-3 overflow-y-auto space-y-3 bg-white">
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${message.sender === "Siz" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-medium">{message.sender}</span>
                    <span className="text-xs text-gray-400 ml-2">{message.time}</span>
                  </div>
                  <div 
                    className={`rounded-lg px-3 py-2 max-w-[90%] text-sm ${
                      message.sender === "Siz" 
                        ? "bg-primary text-white" 
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="border-t p-2 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-grow text-sm px-3 py-2 rounded border focus:outline-none focus:ring-1 focus:ring-primary mr-2"
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={!newMessage.trim()}
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