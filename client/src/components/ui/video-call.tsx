import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneOffIcon, MessagesSquareIcon, ScreenShareIcon } from "lucide-react";

interface VideoCallProps {
  sessionId: string;
  teacherName: string;
  studentName: string;
  onEndCall?: () => void;
}

export function VideoCall({ sessionId, teacherName, studentName, onEndCall }: VideoCallProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: teacherName, text: "Welcome to the class! How are you today?", time: "Just now" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Mock video streams for demo
    const setupMockStream = async () => {
      try {
        // Try to get user media if available in the environment
        // In many environments this will fail with permission errors or not available
        // which is fine for our mock implementation
        navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
          .then(stream => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch(err => {
            console.log("Video permission error or not available:", err);
          });
          
        // Set up mock remote video with a color background
        if (remoteVideoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Create a gradient for the remote "video"
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#1e40af');
            
            const animate = () => {
              if (!remoteVideoRef.current) return;
              
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Add the remote user indicator
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.beginPath();
              ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.font = 'bold 24px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText("Remote User", canvas.width / 2, canvas.height / 2 + 10);
              
              // Convert to video stream
              remoteVideoRef.current.srcObject = canvas.captureStream();
              
              requestAnimationFrame(animate);
            };
            
            animate();
          }
        }
      } catch (error) {
        console.error("Error setting up mock stream:", error);
      }
    };
    
    setupMockStream();
    
    // Cleanup
    return () => {
      // Stop local video stream if it exists
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    
    // In a real implementation, you would toggle the audio track
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
    }
  };
  
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    // In a real implementation, you would toggle the video track
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };
  
  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // In a real implementation, you would handle screen sharing logic here
  };
  
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0");
    
    setMessages([
      ...messages,
      { sender: "You", text: newMessage, time },
    ]);
    
    setNewMessage("");
    
    // Mock response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          sender: Math.random() > 0.5 ? teacherName : studentName, 
          text: "Thanks for your message!", 
          time: "Just now" 
        },
      ]);
    }, 2000);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow">
        <div className={`md:col-span-${isChatOpen ? 8 : 12} h-full flex flex-col`}>
          <div className="relative flex-grow bg-neutral-100 rounded-lg overflow-hidden">
            {/* Remote video (the other participant) */}
            <video 
              ref={remoteVideoRef}
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline
            />
            
            {/* Local video (you) */}
            <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-48 sm:h-36 bg-neutral-900 rounded-lg overflow-hidden shadow-lg">
              <video 
                ref={localVideoRef}
                className="w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 bg-opacity-80">
                  <VideoOffIcon className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          </div>
          
          {/* Video controls */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mt-4">
            <Button
              variant={isAudioEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className="rounded-full h-12 w-12"
            >
              {isAudioEnabled ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className="rounded-full h-12 w-12"
            >
              {isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOffIcon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="icon"
              onClick={toggleScreenShare}
              className="rounded-full h-12 w-12"
            >
              <ScreenShareIcon className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`rounded-full h-12 w-12 ${isChatOpen ? 'bg-blue-100 text-blue-600' : ''}`}
            >
              <MessagesSquareIcon className="h-5 w-5" />
            </Button>
            
            {onEndCall && (
              <Button
                variant="destructive"
                size="icon"
                onClick={onEndCall}
                className="rounded-full h-12 w-12"
              >
                <PhoneOffIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        {isChatOpen && (
          <div className="md:col-span-4 flex flex-col h-full border rounded-lg overflow-hidden">
            <div className="p-3 bg-neutral-50 border-b">
              <h3 className="font-medium">Chat</h3>
            </div>
            
            <div className="flex-grow p-3 overflow-y-auto space-y-3">
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${message.sender === "You" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-medium">{message.sender}</span>
                    <span className="text-xs text-neutral-400 ml-2">{message.time}</span>
                  </div>
                  <div 
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      message.sender === "You" 
                        ? "bg-primary text-white" 
                        : "bg-neutral-100"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="border-t p-3 flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow px-3 py-2 rounded-l-md border border-r-0 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button 
                type="submit" 
                className="rounded-l-none"
              >
                Send
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}