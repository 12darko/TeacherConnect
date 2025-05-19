import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  // Initialize Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Handle video call connections
  io.on("connection", (socket) => {
    console.log("New video call connection:", socket.id);
    
    // Join a room (session)
    socket.on("join-room", (roomId, userId) => {
      console.log(`User ${userId} joined room ${roomId}`);
      socket.join(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit("user-connected", userId);
      
      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        socket.to(roomId).emit("user-disconnected", userId);
      });
    });
    
    // Handle WebRTC signaling
    socket.on("signal", (roomId, userId, signal) => {
      console.log(`Signaling from ${userId} in room ${roomId}`);
      socket.to(roomId).emit("signal", userId, signal);
    });
    
    // Handle messages
    socket.on("send-message", (roomId, message) => {
      console.log(`Message in room ${roomId}:`, message);
      socket.to(roomId).emit("receive-message", message);
    });
    
    // Handle screen sharing
    socket.on("share-screen", (roomId, userId, stream) => {
      console.log(`User ${userId} sharing screen in room ${roomId}`);
      socket.to(roomId).emit("user-sharing-screen", userId, stream);
    });
    
    // Handle stop screen sharing
    socket.on("stop-share-screen", (roomId, userId) => {
      console.log(`User ${userId} stopped sharing screen in room ${roomId}`);
      socket.to(roomId).emit("user-stopped-sharing-screen", userId);
    });
  });

  return io;
}