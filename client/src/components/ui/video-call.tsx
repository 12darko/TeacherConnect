import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MicOffIcon, MicIcon, VideoOffIcon, VideoIcon, PhoneOffIcon, ScreenShareIcon, MessageSquareIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVideoCall } from "@/hooks/useVideoCall";

interface VideoCallProps {
  sessionId: string;
  teacherName: string;
  studentName: string;
  onEndCall?: () => void;
}

export function VideoCall({ sessionId, teacherName, studentName, onEndCall }: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { 
    startCall, 
    endCall, 
    toggleMute, 
    toggleVideo, 
    toggleScreenShare, 
    localStream,
    remoteStream,
    connectionStatus
  } = useVideoCall(sessionId);

  useEffect(() => {
    // Initialize call
    startCall();

    // Cleanup when component unmounts
    return () => {
      endCall();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleScreenShare = () => {
    toggleScreenShare();
    setIsScreenSharing(!isScreenSharing);
  };

  const handleEndCall = () => {
    endCall();
    if (onEndCall) onEndCall();
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow relative bg-neutral-900 rounded-lg overflow-hidden">
        {/* Main video (remote participant or screen share) */}
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        
        {/* Local video preview */}
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        </div>
        
        {/* Connection status overlay */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
            <div className="text-center">
              <div className="mb-2 text-xl font-semibold">
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost'}
              </div>
              <div className="animate-pulse">
                {connectionStatus === 'connecting' 
                  ? 'Waiting for participants to join...' 
                  : 'Trying to reconnect...'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="video" className="mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="video">Video Call</TabsTrigger>
          <TabsTrigger value="whiteboard">Whiteboard</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>
        
        <TabsContent value="video" className="space-y-4">
          <div className="flex justify-center space-x-2">
            <Button 
              variant={isMuted ? "destructive" : "outline"} 
              size="icon" 
              onClick={handleToggleMute}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </Button>
            <Button 
              variant={isVideoOff ? "destructive" : "outline"} 
              size="icon" 
              onClick={handleToggleVideo}
            >
              {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
            </Button>
            <Button 
              variant={isScreenSharing ? "default" : "outline"} 
              size="icon" 
              onClick={handleToggleScreenShare}
            >
              <ScreenShareIcon />
            </Button>
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={handleEndCall}
            >
              <PhoneOffIcon />
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Call Information</h3>
              <p className="text-sm text-neutral-dark">Session with {teacherName} and {studentName}</p>
              <p className="text-sm text-neutral-medium">Session ID: {sessionId}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="whiteboard">
          <div className="h-64 bg-white rounded-lg border border-neutral-200 flex items-center justify-center">
            <p className="text-neutral-medium">Whiteboard functionality will be available in a future update.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="chat">
          <div className="h-64 bg-white rounded-lg border border-neutral-200 p-4 flex flex-col">
            <div className="flex-grow overflow-y-auto space-y-2 mb-4">
              <div className="flex items-start">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                  {teacherName.substring(0, 2)}
                </div>
                <div className="bg-neutral-100 rounded-lg p-2 max-w-xs">
                  <p className="text-sm">Hello! Let me know if you have any questions.</p>
                </div>
              </div>
            </div>
            
            <div className="flex">
              <input 
                type="text" 
                placeholder="Type your message..." 
                className="flex-grow rounded-l-md border border-r-0 border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button className="rounded-l-none">
                <MessageSquareIcon className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
