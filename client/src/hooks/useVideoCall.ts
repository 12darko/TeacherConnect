import { useState, useEffect, useRef } from "react";

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export function useVideoCall(sessionId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const initializeWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      setConnectionStatus("connecting");
      
      // Send join message to the signaling server
      sendSignalingMessage({
        type: 'join',
        sessionId,
      });
    };
    
    ws.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      
      if (message.sessionId !== sessionId) return;
      
      switch (message.type) {
        case 'offer':
          if (!peerConnection.current) initializePeerConnection();
          await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await peerConnection.current!.createAnswer();
          await peerConnection.current!.setLocalDescription(answer);
          sendSignalingMessage({
            type: 'answer',
            sessionId,
            answer,
          });
          break;
          
        case 'answer':
          await peerConnection.current!.setRemoteDescription(new RTCSessionDescription(message.answer));
          break;
          
        case 'candidate':
          if (peerConnection.current && message.candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;
          
        case 'joined':
          // Another user joined, initiate offer if we're the first one
          if (message.isInitiator) {
            makeOffer();
          }
          break;
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus("error");
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setConnectionStatus("disconnected");
    };
  };

  const sendSignalingMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const initializePeerConnection = () => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };
    
    peerConnection.current = new RTCPeerConnection(config);
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.current!.addTrack(track, localStream);
      });
    }
    
    // Listen for remote stream
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setConnectionStatus("connected");
    };
    
    // ICE candidate handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: 'candidate',
          sessionId,
          candidate: event.candidate,
        });
      }
    };
    
    peerConnection.current.oniceconnectionstatechange = () => {
      switch (peerConnection.current!.iceConnectionState) {
        case 'connected':
        case 'completed':
          setConnectionStatus("connected");
          break;
        case 'disconnected':
        case 'failed':
        case 'closed':
          setConnectionStatus("disconnected");
          break;
      }
    };
  };

  const makeOffer = async () => {
    if (!peerConnection.current) initializePeerConnection();
    
    const offer = await peerConnection.current!.createOffer();
    await peerConnection.current!.setLocalDescription(offer);
    
    sendSignalingMessage({
      type: 'offer',
      sessionId,
      offer,
    });
  };

  const startCall = async () => {
    try {
      // Get access to local video and audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      
      // Initialize WebSocket connection
      initializeWebSocket();
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionStatus("error");
    }
  };

  const endCall = () => {
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Close WebSocket connection
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setRemoteStream(null);
    setConnectionStatus("idle");
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (localStream && localStream.getVideoTracks()[0]?.label?.includes('screen')) {
        // Stop screen sharing, resume camera
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Replace existing tracks with camera tracks
        const senders = peerConnection.current?.getSenders() || [];
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
        }
        
        // Update local stream
        localStream.getVideoTracks().forEach(track => track.stop());
        localStream.removeTrack(localStream.getVideoTracks()[0]);
        localStream.addTrack(cameraStream.getVideoTracks()[0]);
        
        setLocalStream(localStream);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        // Replace video track with screen track
        const senders = peerConnection.current?.getSenders() || [];
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        if (videoSender && screenStream.getVideoTracks()[0]) {
          videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        
        // Update local stream
        if (localStream.getVideoTracks().length > 0) {
          localStream.removeTrack(localStream.getVideoTracks()[0]);
        }
        localStream.addTrack(screenStream.getVideoTracks()[0]);
        
        // Handle when user stops sharing screen via the browser UI
        screenStream.getVideoTracks()[0].onended = async () => {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoSender = peerConnection.current?.getSenders().find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
          }
          
          localStream.removeTrack(localStream.getVideoTracks()[0]);
          localStream.addTrack(cameraStream.getVideoTracks()[0]);
          
          setLocalStream(localStream);
        };
        
        setLocalStream(localStream);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    localStream,
    remoteStream,
    connectionStatus,
  };
}
