import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneOffIcon, MessagesSquareIcon, ScreenShareIcon } from "lucide-react";
import { io, Socket } from "socket.io-client";
import Peer from "simple-peer";
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
    { sender: teacherName, text: "Welcome to the class! How are you today?", time: "Just now" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callConnected, setCallConnected] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const otherUserId = useRef<string | null>(null);
  
  // Connect to Socket.IO server
  useEffect(() => {
    // Create Socket.IO connection
    const socket = io("/", {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5
    });
    
    socketRef.current = socket;
    
    // Handle connection
    socket.on("connect", () => {
      console.log("Connected to server with socket ID:", socket.id);
      
      // Join the room with the session ID
      socket.emit("join-room", sessionId, user?.id);
      
      toast({
        title: "Connected to class",
        description: "You are now connected to the virtual classroom",
      });
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setCallConnected(false);
      
      toast({
        title: "Disconnected",
        description: "Lost connection to the classroom",
        variant: "destructive",
      });
    });
    
    // When another user connects to the room
    socket.on("user-connected", (userId) => {
      console.log("User connected to the room:", userId);
      otherUserId.current = userId;
      
      // Initiate call if we have local media
      if (stream) {
        callUser(userId);
      }
    });
    
    // When receiving a call
    socket.on("signal", (userId, signal) => {
      console.log("Received signal from user:", userId);
      
      if (signal.type === "offer") {
        // This is an offer, so create peer and answer
        answerCall(userId, signal);
      } else if (signal.type === "answer") {
        // This is an answer to our offer
        if (peerRef.current) {
          peerRef.current.signal(signal);
        }
      } else {
        // This is a ICE candidate
        if (peerRef.current) {
          peerRef.current.signal(signal);
        }
      }
    });
    
    // When a user disconnects
    socket.on("user-disconnected", (userId) => {
      console.log("User disconnected:", userId);
      
      // Close the peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      setCallConnected(false);
      
      toast({
        title: "User Disconnected",
        description: "The other participant has left the classroom",
      });
    });
    
    // Handle chat messages
    socket.on("receive-message", (message) => {
      const now = new Date();
      const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0");
      
      setMessages(prev => [
        ...prev,
        { 
          sender: message.userId === user?.id ? "You" : (message.role === "teacher" ? teacherName : studentName),
          text: message.text,
          time
        },
      ]);
    });
    
    // Cleanup function
    return () => {
      // Destroy peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      
      // Close socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      // Stop media tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, user?.id, teacherName, studentName, toast]);
  
  // Get user media (camera/microphone)
  useEffect(() => {
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        console.log("Got local media stream");
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        
        setStream(mediaStream);
        
        // If the other user is already in the room, call them
        if (otherUserId.current) {
          callUser(otherUserId.current);
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        
        toast({
          title: "Camera/Microphone Access Error",
          description: "Unable to access your camera or microphone. Please check permissions.",
          variant: "destructive",
        });
        
        // Create fallback canvas for local video
        createFallbackVideo(localVideoRef, "You");
      }
    };
    
    getMedia();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  // Function to create a call to another user
  const callUser = (userId: string) => {
    console.log("Calling user:", userId);
    
    if (!stream) {
      console.error("Local stream not available");
      return;
    }
    
    // Create a new peer as initiator
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    
    // Handle the signal event
    peer.on("signal", (data) => {
      console.log("Generated signal to send to peer");
      
      // Send the signal to the server
      if (socketRef.current) {
        socketRef.current.emit("signal", sessionId, user?.id, data);
      }
    });
    
    // Handle the stream event
    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      
      setCallConnected(true);
    });
    
    // Handle peer errors
    peer.on("error", (err) => {
      console.error("Peer connection error:", err);
      
      toast({
        title: "Connection Error",
        description: "There was a problem connecting to the other participant",
        variant: "destructive",
      });
    });
    
    peerRef.current = peer;
  };
  
  // Function to answer a call
  const answerCall = (userId: string, signal: any) => {
    console.log("Answering call from user:", userId);
    
    if (!stream) {
      console.error("Local stream not available");
      return;
    }
    
    // Create a new peer (not as initiator)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    
    // Handle the signal event
    peer.on("signal", (data) => {
      console.log("Generated answer signal");
      
      // Send the signal back to the caller
      if (socketRef.current) {
        socketRef.current.emit("signal", sessionId, user?.id, data);
      }
    });
    
    // Handle the stream event
    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      
      setCallConnected(true);
    });
    
    // Handle peer errors
    peer.on("error", (err) => {
      console.error("Peer connection error:", err);
      
      toast({
        title: "Connection Error",
        description: "There was a problem connecting to the other participant",
        variant: "destructive",
      });
    });
    
    // Signal the peer with the offer we received
    peer.signal(signal);
    
    peerRef.current = peer;
  };
  
  // Create a fallback video from canvas
  const createFallbackVideo = (videoRef: React.RefObject<HTMLVideoElement>, label: string) => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#1e40af');
      
      const animate = () => {
        if (!videoRef.current) return;
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add user indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 10);
        
        // Convert to video stream
        videoRef.current.srcObject = canvas.captureStream();
        
        requestAnimationFrame(animate);
      };
      
      animate();
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (!stream) return;
    
    const audioTracks = stream.getAudioTracks();
    
    audioTracks.forEach(track => {
      track.enabled = !isAudioEnabled;
    });
    
    setIsAudioEnabled(!isAudioEnabled);
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (!stream) return;
    
    const videoTracks = stream.getVideoTracks();
    
    videoTracks.forEach(track => {
      track.enabled = !isVideoEnabled;
    });
    
    setIsVideoEnabled(!isVideoEnabled);
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and go back to camera
      if (stream) {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      }
      
      try {
        // Get camera again
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
        
        setStream(mediaStream);
        
        // Notify peer that screen sharing has ended
        if (peerRef.current && peerRef.current._channel) {
          try {
            peerRef.current._channel.send(JSON.stringify({ type: 'screen-share-ended' }));
          } catch (err) {
            console.error("Error notifying peer about screen share end:", err);
          }
        }
        
        setIsScreenSharing(false);
      } catch (err) {
        console.error("Error switching back to camera:", err);
      }
    } else {
      // Start screen sharing
      try {
        const displayMedia = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayMedia;
        }
        
        // Keep audio from original stream
        if (stream) {
          stream.getAudioTracks().forEach(track => {
            displayMedia.addTrack(track);
          });
        }
        
        // Notify peer about screen sharing
        if (peerRef.current && peerRef.current._channel) {
          try {
            peerRef.current._channel.send(JSON.stringify({ type: 'screen-share-started' }));
          } catch (err) {
            console.error("Error notifying peer about screen share:", err);
          }
        }
        
        // Stop screen sharing when the user ends it from the browser UI
        displayMedia.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setStream(displayMedia);
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };
  
  // Send chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;
    
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, "0");
    
    // Add message to local state
    setMessages(prev => [
      ...prev,
      { sender: "You", text: newMessage, time },
    ]);
    
    // Send message to server
    socketRef.current.emit("send-message", sessionId, {
      userId: user?.id,
      role: user?.role,
      text: newMessage,
      timestamp: new Date().toISOString()
    });
    
    setNewMessage("");
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