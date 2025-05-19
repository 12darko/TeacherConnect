import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneOffIcon, MessagesSquareIcon, ScreenShareIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VideoCallProps {
  sessionId: string;
  teacherName: string;
  studentName: string;
  onEndCall?: () => void;
}

export function VideoCall({ sessionId, teacherName, studentName, onEndCall }: VideoCallProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: teacherName, text: "Hoş geldiniz! Nasılsınız?", time: "Şimdi" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // İki video akışı hazırlayan fonksiyon
  useEffect(() => {
    const prepareMedia = async () => {
      try {
        // Kamera ve mikrofon erişimi için izin isteyelim
        navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
          .then(stream => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              setLocalStream(stream);
            }
            
            // Yeni bir özellik ekledik - bu çalıştığında toast gösterilecek
            toast({
              title: "Kamera ve mikrofon bağlandı",
              description: "Görüntülü görüşme başlatıldı",
            });
          })
          .catch(err => {
            console.log("Video izni hatası:", err);
            toast({
              title: "Kamera/mikrofon erişimi sağlanamadı",
              description: "Lütfen izinleri kontrol edin",
              variant: "destructive",
            });
            
            // Yerel video için canvas arka plan oluşturalım
            createCanvasBackground(localVideoRef, "Siz");
          });
          
        // Uzak video için test amaçlı bir canvas arka plan
        createCanvasBackground(remoteVideoRef, "Diğer kullanıcı");
      } catch (error) {
        console.error("Medya erişiminde hata:", error);
        toast({
          title: "Medya erişim hatası",
          description: "Video görüşme başlatılamadı",
          variant: "destructive",
        });
      }
    };
    
    prepareMedia();
    
    // Temizleme işlemi
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  // Canvas arka plan oluşturma - test için
  const createCanvasBackground = (videoRef: React.RefObject<HTMLVideoElement>, label: string) => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Gradient arka plan oluştur
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1e40af');
      
      const animate = () => {
        if (!videoRef.current) return;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Kullanıcı göstergesi
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 10);
        
        // Video stream oluştur
        videoRef.current.srcObject = canvas.captureStream();
        
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  };
  
  // Ses açma/kapatma
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
    }
    setIsAudioEnabled(!isAudioEnabled);
  };
  
  // Video açma/kapatma 
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };
  
  // Ekran paylaşımı
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Ekran paylaşımını durdur ve kameraya geri dön
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        
        setLocalStream(mediaStream);
        setIsScreenSharing(false);
        
        toast({
          title: "Ekran paylaşımı durduruldu",
          description: "Kamera görüntüsüne geri dönüldü"
        });
      } else {
        // Ekran paylaşımını başlat
        try {
          const displayMedia = await navigator.mediaDevices.getDisplayMedia({ 
            video: true 
          });
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = displayMedia;
          }
          
          // Ses için orijinal streamden alıyoruz
          if (localStream) {
            localStream.getAudioTracks().forEach(track => {
              displayMedia.addTrack(track);
            });
          }
          
          // Kullanıcı tarayıcıdan durdurunca otomatik kapat
          displayMedia.getVideoTracks()[0].onended = () => {
            toggleScreenShare();
          };
          
          setLocalStream(displayMedia);
          setIsScreenSharing(true);
          
          toast({
            title: "Ekran paylaşımı başlatıldı",
            description: "Ekranınız diğer kullanıcıya gösteriliyor"
          });
        } catch (err) {
          console.error("Ekran paylaşımı hatası:", err);
          toast({
            title: "Ekran paylaşımı hatası",
            description: "Ekran paylaşımı başlatılamadı",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error("Ekran paylaşımı/kamera geçiş hatası:", err);
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
    
    // Simüle edilmiş yanıt
    setTimeout(() => {
      const replyName = user?.role === "teacher" ? studentName : teacherName;
      setMessages(prev => [
        ...prev,
        { 
          sender: replyName, 
          text: "Mesajınız için teşekkürler! Size nasıl yardımcı olabilirim?", 
          time: "Şimdi" 
        },
      ]);
    }, 2000);
  };
  
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-neutral-50 to-white rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow">
        <div className={`md:col-span-${isChatOpen ? 8 : 12} h-full flex flex-col`}>
          {/* Video alanı */}
          <div className="relative flex-grow bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden shadow-inner">
            {/* Uzak video (diğer katılımcı) */}
            <video 
              ref={remoteVideoRef}
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline
            />
            
            {/* Kullanıcı bilgisi - Diğer katılımcı */}
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
              {user?.role === "teacher" ? studentName : teacherName}
            </div>
            
            {/* Yerel video (siz) */}
            <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-52 sm:h-40 rounded-xl overflow-hidden shadow-xl border-2 border-white/20">
              <video 
                ref={localVideoRef}
                className="w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted
              />
              
              {/* Kullanıcı bilgisi - Siz */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white px-2 py-1 text-xs">
                Siz {isScreenSharing && "- Ekran Paylaşımı"}
              </div>
              
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 backdrop-blur-sm">
                  <VideoOffIcon className="h-8 w-8 text-white/60 mb-2" />
                  <span className="text-xs text-white/80">Video kapalı</span>
                </div>
              )}
            </div>
            
            {/* Durum bilgisi */}
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
              {isScreenSharing ? "Ekran Paylaşımı Aktif" : "Canlı Ders"}
            </div>
          </div>
          
          {/* Video kontrolleri - Modern tasarım */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-5 my-4 px-4">
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className="rounded-full h-14 w-14 shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isAudioEnabled ? <MicIcon className="h-6 w-6" /> : <MicOffIcon className="h-6 w-6" />}
            </Button>
            
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className="rounded-full h-14 w-14 shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isVideoEnabled ? <VideoIcon className="h-6 w-6" /> : <VideoOffIcon className="h-6 w-6" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="icon"
              onClick={toggleScreenShare}
              className="rounded-full h-14 w-14 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ScreenShareIcon className="h-6 w-6" />
            </Button>
            
            <Button
              variant={isChatOpen ? "default" : "secondary"}
              size="icon"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="rounded-full h-14 w-14 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <MessagesSquareIcon className="h-6 w-6" />
              {messages.length > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {messages.length}
                </span>
              )}
            </Button>
            
            {onEndCall && (
              <Button
                variant="destructive"
                size="icon"
                onClick={onEndCall}
                className="rounded-full h-14 w-14 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <PhoneOffIcon className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Chat / Sohbet paneli - Modern tasarım */}
        {isChatOpen && (
          <div className="md:col-span-4 flex flex-col h-full border rounded-xl overflow-hidden shadow-md bg-white">
            <div className="p-4 bg-primary/5 border-b">
              <h3 className="font-semibold text-primary flex items-center">
                <MessagesSquareIcon className="h-4 w-4 mr-2" />
                Canlı Sohbet
              </h3>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${message.sender === "Siz" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-semibold">{message.sender}</span>
                    <span className="text-xs text-neutral-400 ml-2">{message.time}</span>
                  </div>
                  <div 
                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                      message.sender === "Siz" 
                        ? "bg-primary text-white" 
                        : "bg-neutral-100"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="border-t p-3 flex items-center bg-white">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="flex-grow px-4 py-2.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-primary/30 mr-2"
              />
              <Button 
                type="submit" 
                size="sm"
                className="rounded-full px-4"
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