import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupWebSocketDiagnostic } from "./websocket-diagnostic";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertTeacherProfileSchema, insertSessionSchema, insertReviewSchema, insertExamSchema, insertExamAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from "ws";
import { setupSocketIO } from "./socket";
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser
} from "./auth";
import {
  isAuthenticated,
  hasRole
} from "./auth";
import session from "express-session";

// Session type augmentation
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server for the application
  const httpServer = createServer(app);
  
  // Initialize WebSocket diagnostic utility
  setupWebSocketDiagnostic(httpServer);
  
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);
  
  // Initialize Socket.IO for video calls
  setupSocketIO(httpServer);
  
  // Custom authentication routes (local authentication)
  apiRouter.post('/auth/register', registerUser);
  apiRouter.post('/auth/login', loginUser);
  apiRouter.post('/auth/logout', logoutUser);
  
  // User authentication route - get current user
  apiRouter.get('/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Eski rotayı da destekleyelim (geriye dönük uyumluluk için)
  apiRouter.get('/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Route to update user role (admin only)
  apiRouter.patch('/api/auth/role/:userId', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(userId, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // (WebSocket setup is now handled in the top section)

  // Authentication is handled by Replit Auth middleware
  // These routes are no longer needed as we use the /api/login and /api/logout endpoints from replitAuth.ts
  
  // Route to request role upgrade (for teachers)
  apiRouter.post("/api/auth/request-role", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { requestedRole } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!requestedRole || !['student', 'teacher'].includes(requestedRole)) {
        return res.status(400).json({ message: "Invalid role requested" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // This is just a request - admin will need to approve via the role update endpoint
      return res.status(200).json({ 
        message: `Role upgrade to ${requestedRole} requested. An administrator will review your request.`,
        currentRole: user.role
      });
    } catch (error) {
      console.error("Error requesting role upgrade:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Subject routes
  apiRouter.get("/subjects", async (req: Request, res: Response) => {
    try {
      const subjects = await storage.getSubjects();
      return res.status(200).json(subjects);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.get("/subjects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subject ID" });
      }
      
      const subject = await storage.getSubject(id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      return res.status(200).json(subject);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Teacher profile routes
  apiRouter.get("/teachers", async (req: Request, res: Response) => {
    try {
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
      
      let teachers;
      if (subjectId && !isNaN(subjectId)) {
        teachers = await storage.getTeachersBySubject(subjectId);
      } else {
        teachers = await storage.getTeacherProfiles();
      }
      
      // Get user details for each teacher
      const teachersWithUserDetails = await Promise.all(
        teachers.map(async (teacher) => {
          const user = await storage.getUser(teacher.userId);
          return {
            ...teacher,
            firstName: user?.firstName,
            lastName: user?.lastName,
            fullName: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.firstName || 'Teacher',
            email: user?.email,
            bio: user?.bio,
            profileImageUrl: user?.profileImageUrl
          };
        })
      );
      
      return res.status(200).json(teachersWithUserDetails);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // API endpoint for getting users by role
  apiRouter.get("/users", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string;
      
      if (!role) {
        return res.status(200).json([]);
      }
      
      // Get all users with specified role
      const users = await storage.getAllUsers();
      const filteredUsers = users.filter(user => user.role === role);
      
      return res.status(200).json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // API endpoint for getting teacher profile by user ID
  apiRouter.get("/teachers/profile", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if user exists and is a teacher
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role !== "teacher") {
        return res.status(403).json({ message: "User is not a teacher" });
      }
      
      // Get teacher profile
      const profile = await storage.getTeacherProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }
      
      // Get subject details
      const subjectIds = profile.subjectIds as number[];
      const subjects = await Promise.all(
        subjectIds.map(id => storage.getSubject(id))
      );
      
      // Get total reviews and sessions
      const reviews = await storage.getReviewsByTeacher(userId);
      const sessions = await storage.getSessionsByTeacher(userId);
      const completedSessions = sessions.filter(s => s.status === "completed");
      
      // Return combined data
      return res.status(200).json({
        ...profile,
        user,
        subjects: subjects.filter(Boolean), // Filter out any undefined subjects
        totalReviews: reviews.length,
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
      });
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.get("/teachers/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      
      // Get teacher profile and user details
      const user = await storage.getUser(id);
      if (!user || user.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const profile = await storage.getTeacherProfileByUserId(id);
      if (!profile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }
      
      // Get subjects this teacher teaches
      const subjects = await storage.getSubjects();
      const teacherSubjects = subjects.filter(subject => 
        Array.isArray(profile.subjectIds) && profile.subjectIds.includes(subject.id)
      );
      
      // Get reviews for this teacher
      const reviews = await storage.getReviewsByTeacher(id);
      
      return res.status(200).json({
        ...profile,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.firstName || 'Teacher',
        email: user.email,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        subjects: teacherSubjects,
        reviews
      });
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/teachers", async (req: Request, res: Response) => {
    try {
      // Validate profile data
      const profileData = insertTeacherProfileSchema.parse(req.body);
      
      // Check if user exists and is a teacher
      const user = await storage.getUser(profileData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role !== "teacher") {
        return res.status(400).json({ message: "User is not a teacher" });
      }
      
      // Check if teacher profile already exists
      const existingProfile = await storage.getTeacherProfileByUserId(user.id);
      if (existingProfile) {
        return res.status(400).json({ message: "Teacher profile already exists" });
      }
      
      // Create profile
      const profile = await storage.createTeacherProfile(profileData);
      
      return res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Session routes
  apiRouter.get("/sessions", async (req: Request, res: Response) => {
    try {
      const teacherId = req.query.teacherId ? String(req.query.teacherId) : undefined;
      const studentId = req.query.studentId ? String(req.query.studentId) : undefined;
      
      console.log("Sessions API called with teacherId:", teacherId, "studentId:", studentId);
      
      let sessions;
      if (teacherId) {
        console.log("Getting sessions for teacher ID:", teacherId);
        sessions = await storage.getSessionsByTeacher(teacherId);
      } else if (studentId) {
        console.log("Getting sessions for student ID:", studentId);
        sessions = await storage.getSessionsByStudent(studentId);
      } else {
        console.log("Getting all sessions");
        sessions = await storage.getSessions();
      }
      
      console.log("Found sessions:", sessions);
      
      // Expand sessions with user and subject details
      const expandedSessions = await Promise.all(
        sessions.map(async (session) => {
          const teacher = await storage.getUser(session.teacherId);
          const student = await storage.getUser(session.studentId);
          const subject = await storage.getSubject(session.subjectId);
          
          return {
            ...session,
            teacherName: teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : 'Unknown Teacher',
            studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown Student',
            subjectName: subject?.name || 'Unknown Subject'
          };
        })
      );
      
      return res.status(200).json(expandedSessions);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.get("/sessions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const session = await storage.getSession(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Expand session with user and subject details
      const teacher = await storage.getUser(session.teacherId);
      const student = await storage.getUser(session.studentId);
      const subject = await storage.getSubject(session.subjectId);
      
      return res.status(200).json({
        ...session,
        teacherName: teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : "İsim bilgisi yok",
        studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : "İsim bilgisi yok",
        teacherEmail: teacher?.email,
        studentEmail: student?.email,
        subjectName: subject?.name
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { studentId, subjectId, title, description, startTime } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "Only teachers can create sessions" });
      }
      
      // Validate required fields
      if (!studentId || !subjectId || !title || !startTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if student exists
      const student = await storage.getUser(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found or is not a student" });
      }
      
      // Check if subject exists
      const subject = await storage.getSubject(parseInt(subjectId));
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      // Bitiş zamanı (endTime) varsayılan olarak 60 dakika sonrası, 
      // ama eğer gönderilmişse o değeri kullan
      const startDateTime = new Date(startTime);
      let endDateTime;
      
      if (req.body.endTime) {
        endDateTime = new Date(req.body.endTime);
      } else {
        // Varsayılan olarak 60 dakika süre ekle
        endDateTime = new Date(startDateTime.getTime() + 60 * 60000);
      }
      
      // Create session
      const session = await storage.createSession({
        teacherId: req.user.id,
        studentId,
        subjectId: parseInt(subjectId),
        title,
        description: description || null,
        startTime: startDateTime,
        endTime: endDateTime,
        status: "scheduled",
      });
      
      return res.status(201).json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // İlk endpoint: /sessions/:id/status - önceki işlevsellik korunur
  apiRouter.patch("/sessions/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const { status } = req.body;
      if (!status || !["scheduled", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const session = await storage.updateSessionStatus(id, status);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      return res.status(200).json(session);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Yeni endpoint: /sessions/:id - doğrudan dersi günceller (istemcinin kullandığı)
  apiRouter.patch("/sessions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("PATCH request received for session update with body:", req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error("Invalid session ID:", req.params.id);
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Gelen veriyi kontrol et
      const { status } = req.body;
      if (status && !["scheduled", "completed", "cancelled"].includes(status)) {
        console.error("Invalid status value:", status);
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Status değişikliği varsa, sessionStatus'u güncelle
      if (status) {
        console.log(`Updating session ${id} status to ${status}`);
        const session = await storage.updateSessionStatus(id, status);
        if (!session) {
          console.error(`Session with id ${id} not found`);
          return res.status(404).json({ message: "Session not found" });
        }
        console.log("Session successfully updated:", session);
        return res.status(200).json(session);
      }
      
      // İleride başka alan güncellemeleri gerekirse buraya eklenebilir
      console.error("No valid update fields provided in request body");
      return res.status(400).json({ message: "No valid update fields provided" });
    } catch (error) {
      console.error("Error updating session:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Classroom routes for session recordings
  apiRouter.get('/sessions/:sessionId/recordings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const recordings = await storage.getSessionRecordings(sessionId);
      res.json(recordings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.post('/sessions/:sessionId/recordings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { userId, recordingUrl, duration } = req.body;
      
      const recording = await storage.createSessionRecording({
        sessionId,
        userId,
        recordingUrl,
        duration: parseInt(duration) || 0
      });
      
      res.status(201).json(recording);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.delete('/sessions/recordings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSessionRecording(id);
      
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Recording not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Classroom routes for session notes
  apiRouter.get('/sessions/:sessionId/notes', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.query.userId as string;
      
      let notes;
      if (userId) {
        notes = await storage.getSessionNotesByUser(sessionId, userId);
      } else {
        notes = await storage.getSessionNotes(sessionId);
      }
      
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.post('/sessions/:sessionId/notes', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { userId, content, isPrivate } = req.body;
      
      const note = await storage.createSessionNote({
        sessionId,
        userId,
        content,
        isPrivate: isPrivate || false
      });
      
      res.status(201).json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.put('/sessions/notes/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      
      const updatedNote = await storage.updateSessionNote(id, content);
      
      if (updatedNote) {
        res.json(updatedNote);
      } else {
        res.status(404).json({ message: "Note not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.delete('/sessions/notes/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSessionNote(id);
      
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Note not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Classroom routes for whiteboard snapshots
  apiRouter.get('/sessions/:sessionId/whiteboard', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const snapshots = await storage.getWhiteboardSnapshots(sessionId);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.post('/sessions/:sessionId/whiteboard', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { userId, imageData, title } = req.body;
      
      const snapshot = await storage.createWhiteboardSnapshot({
        sessionId,
        userId,
        imageData,
        title: title || `Snapshot ${new Date().toLocaleTimeString()}`
      });
      
      res.status(201).json(snapshot);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.delete('/sessions/whiteboard/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWhiteboardSnapshot(id);
      
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Whiteboard snapshot not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Classroom routes for session files
  apiRouter.get('/sessions/:sessionId/files', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = req.query.userId as string;
      
      let files;
      if (userId) {
        files = await storage.getSessionFilesByUser(sessionId, userId);
      } else {
        files = await storage.getSessionFiles(sessionId);
      }
      
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.post('/sessions/:sessionId/files', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { uploadedBy, fileName, fileUrl, fileType, fileSize } = req.body;
      
      const file = await storage.createSessionFile({
        sessionId,
        uploadedBy,
        fileName,
        fileUrl,
        fileType,
        fileSize
      });
      
      res.status(201).json(file);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  apiRouter.delete('/sessions/files/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSessionFile(id);
      
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Review routes
  // Testimonial routes - Site üzerinde gösterilecek kullanıcı yorumları
  apiRouter.get("/testimonials", async (req: Request, res: Response) => {
    try {
      const { featured } = req.query;
      const testimonials = await storage.getTestimonials();
      
      // Filter only visible testimonials
      const visibleTestimonials = testimonials.filter(t => t.visible);
      
      // If featured is requested, send 3 random testimonials
      if (featured === 'true' && visibleTestimonials.length > 0) {
        // Select 3 random testimonials (or all if there are fewer)
        const count = Math.min(3, visibleTestimonials.length);
        
        // Use Fisher-Yates shuffle algorithm for random selection
        const shuffled = [...visibleTestimonials];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return res.status(200).json(shuffled.slice(0, count));
      }
      
      return res.status(200).json(visibleTestimonials);
    } catch (error) {
      console.error("Error retrieving testimonials:", error);
      return res.status(500).json({ message: "An error occurred while retrieving testimonials" });
    }
  });
  
  // Site Statistics API
  apiRouter.get("/statistics", async (req: Request, res: Response) => {
    try {
      // Use the getSiteStatistics method instead of calculating manually
      const stats = await storage.getSiteStatistics();
      
      if (!stats) {
        // Provide default statistics if none are found in the database
        return res.status(200).json({
          totalStudents: 10000,
          totalTeachers: 1000,
          totalSubjects: 50,
          totalSessions: 100000
        });
      }
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error retrieving statistics:", error);
      return res.status(500).json({ message: "An error occurred while retrieving statistics" });
    }
  });
  
  // Application Settings API
  apiRouter.get("/app-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAppSettings();
      return res.status(200).json(settings || {});
    } catch (error) {
      console.error("Error retrieving application settings:", error);
      return res.status(500).json({ message: "An error occurred while retrieving application settings" });
    }
  });
  
  // Pricing Plans API
  apiRouter.get("/pricing-plans", async (req: Request, res: Response) => {
    try {
      const plans = await storage.getPricingPlans();
      return res.status(200).json(plans);
    } catch (error) {
      console.error("Error retrieving pricing plans:", error);
      return res.status(500).json({ message: "An error occurred while retrieving pricing plans" });
    }
  });
  
  // FAQ Items API
  apiRouter.get("/faq-items", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const items = await storage.getFaqItems(category);
      return res.status(200).json(items);
    } catch (error) {
      console.error("Error retrieving FAQ items:", error);
      return res.status(500).json({ message: "An error occurred while retrieving FAQ items" });
    }
  });
  
  // How It Works API
  apiRouter.get("/how-it-works", async (req: Request, res: Response) => {
    try {
      const steps = await storage.getHowItWorksSteps();
      return res.status(200).json(steps);
    } catch (error) {
      console.error("Error getting 'how it works' steps:", error);
      return res.status(500).json({ error: "Failed to fetch 'how it works' steps" });
    }
  });
  
  // Site Features API
  apiRouter.get("/features", async (req: Request, res: Response) => {
    try {
      const features = await storage.getFeatures();
      return res.status(200).json(features.filter(f => f.visible).sort((a, b) => a.order_position - b.order_position));
    } catch (error) {
      console.error("Error retrieving features:", error);
      return res.status(500).json({ message: "An error occurred while retrieving features" });
    }
  });

  apiRouter.get("/reviews", async (req: Request, res: Response) => {
    try {
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      
      let reviews;
      if (teacherId && !isNaN(teacherId)) {
        reviews = await storage.getReviewsByTeacher(teacherId);
      } else {
        reviews = await storage.getReviews();
      }
      
      // Expand reviews with user details
      const expandedReviews = await Promise.all(
        reviews.map(async (review) => {
          const student = await storage.getUser(review.studentId);
          
          return {
            ...review,
            studentName: student?.name,
            studentProfileImage: student?.profileImage
          };
        })
      );
      
      return res.status(200).json(expandedReviews);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/reviews", async (req: Request, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      
      // Check if session exists
      const session = await storage.getSession(reviewData.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if student and teacher match the session
      if (session.studentId !== reviewData.studentId) {
        return res.status(400).json({ message: "Student ID does not match session" });
      }
      
      if (session.teacherId !== reviewData.teacherId) {
        return res.status(400).json({ message: "Teacher ID does not match session" });
      }
      
      // Create review
      const review = await storage.createReview(reviewData);
      
      return res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Exam routes
  apiRouter.get("/exams", async (req: Request, res: Response) => {
    try {
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      
      let exams;
      if (teacherId && !isNaN(teacherId)) {
        exams = await storage.getExamsByTeacher(teacherId);
      } else {
        exams = await storage.getExams();
      }
      
      // Expand exams with teacher and subject details
      const expandedExams = await Promise.all(
        exams.map(async (exam) => {
          const teacher = await storage.getUser(exam.teacherId);
          const subject = await storage.getSubject(exam.subjectId);
          
          return {
            ...exam,
            teacherName: teacher?.name,
            subjectName: subject?.name
          };
        })
      );
      
      return res.status(200).json(expandedExams);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.get("/exams/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Expand exam with teacher and subject details
      const teacher = await storage.getUser(exam.teacherId);
      const subject = await storage.getSubject(exam.subjectId);
      
      return res.status(200).json({
        ...exam,
        teacherName: teacher?.name,
        subjectName: subject?.name
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/exams", isAuthenticated, hasRole("teacher"), async (req: Request, res: Response) => {
    try {
      console.log("Exam creation requested by:", req.user?.id, "with role:", req.user?.role);
      console.log("Exam data received:", JSON.stringify(req.body, null, 2));
      
      // Doğrudan ham veri alarak SQL sorgusu ile veritabanına ekleyelim
      // Validasyon katmanını tamamen atlıyoruz
      const { title, description, subjectId, questions } = req.body;
      
      if (!title || !subjectId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      try {
        // Basit manuel doğrulama ve dönüşüm
        const teacherId = req.user?.id || '';
        const parsedSubjectId = parseInt(subjectId);
        
        // Sınav nesnesi oluştur
        const examData = {
          teacherId: teacherId,
          subjectId: parsedSubjectId,
          title: title,
          description: description || "",
          questions: questions.map((q, i) => ({
            id: i + 1,
            question: q.question || `Soru ${i+1}`,
            type: q.type || "multiple-choice",
            options: Array.isArray(q.options) ? q.options.filter(o => o && o.trim()) : [],
            correctAnswer: q.type === "multiple-choice" ? (Number(q.correctAnswer) || 0) : (q.correctAnswer || ""),
            points: Number(q.points) || 10
          }))
        };
        
        // storage API'sini kullanarak sınav oluştur
        const exam = await storage.createExam(examData);
        
        // Başarılı yanıt gönder
        return res.status(201).json(exam);
      } catch (err) {
        console.error("SQL Error:", err);
        return res.status(500).json({ 
          message: "Error creating exam", 
          error: err instanceof Error ? err.message : String(err)
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error("Error creating exam:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Exam assignment routes
  apiRouter.get("/exam-assignments", async (req: Request, res: Response) => {
    try {
      const studentId = req.query.studentId as string;
      
      let assignments;
      if (studentId) {
        assignments = await storage.getExamAssignmentsByStudent(studentId);
      } else {
        assignments = await storage.getExamAssignments();
      }
      
      // Expand assignments with exam and student details
      const expandedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const exam = await storage.getExam(assignment.examId);
          const student = await storage.getUser(assignment.studentId);
          const subject = exam ? await storage.getSubject(exam.subjectId) : null;
          const teacher = exam ? await storage.getUser(exam.teacherId) : null;
          
          return {
            ...assignment,
            examTitle: exam?.title,
            subjectName: subject?.name,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
            studentName: student ? `${student.firstName} ${student.lastName}` : null,
            questionCount: exam?.questions?.length || 0,
            timeLimit: 60, // Default time limit in minutes
          };
        })
      );
      
      return res.status(200).json(expandedAssignments);
    } catch (error) {
      console.error("Error fetching exam assignments:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.get("/exam-assignments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const assignment = await storage.getExamAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Expand assignment with exam and student details
      const exam = await storage.getExam(assignment.examId);
      const student = await storage.getUser(assignment.studentId);
      
      return res.status(200).json({
        ...assignment,
        examTitle: exam?.title,
        examDescription: exam?.description,
        examQuestions: exam?.questions,
        studentName: student?.name
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/exam-assignments", isAuthenticated, hasRole("teacher"), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const { examId, studentIds, dueDate } = req.body;
      
      if (!examId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ 
          message: "Invalid request body. Required: examId, studentIds (array of at least one student)" 
        });
      }
      
      // Check if exam exists
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if the teacher owns this exam
      if (req.user?.id !== exam.teacherId) {
        return res.status(403).json({ message: "You can only assign exams that you created" });
      }
      
      // Batch create assignments for all students
      const assignmentResults = [];
      const failedAssignments = [];
      
      for (const studentId of studentIds) {
        try {
          // Check if student exists
          const student = await storage.getUser(studentId);
          if (!student || student.role !== "student") {
            failedAssignments.push({ studentId, reason: "Student not found or not a student" });
            continue;
          }
          
          // Check if an assignment already exists for this student and exam
          const existingAssignments = await storage.getExamAssignmentsByStudent(studentId);
          const alreadyAssigned = existingAssignments.some(a => a.examId === examId);
          
          if (alreadyAssigned) {
            failedAssignments.push({ studentId, reason: "Exam already assigned to this student" });
            continue;
          }
          
          // Create assignment
          const assignmentData = {
            examId,
            studentId,
            dueDate: dueDate ? new Date(dueDate) : undefined
          };
          
          const assignment = await storage.createExamAssignment(assignmentData);
          assignmentResults.push(assignment);
        } catch (error) {
          console.error(`Error assigning exam to student ${studentId}:`, error);
          failedAssignments.push({ studentId, reason: "Internal error during assignment" });
        }
      }
      
      // Return results
      return res.status(201).json({
        success: true,
        assignedCount: assignmentResults.length,
        assignments: assignmentResults,
        failedAssignments: failedAssignments.length > 0 ? failedAssignments : undefined
      });
    } catch (error) {
      console.error("Error creating exam assignments:", error);
      return res.status(500).json({ message: "Internal server error", error: String(error) });
    }
  });
  
  apiRouter.post("/exam-assignments/:id/submit", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Invalid answers format" });
      }
      
      // Get assignment and exam
      const assignment = await storage.getExamAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify the student has access to this assignment
      if (req.user?.id !== assignment.studentId) {
        return res.status(403).json({ message: "You can only submit your own assignments" });
      }
      
      const exam = await storage.getExam(assignment.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if already completed
      if (assignment.completed) {
        return res.status(400).json({ message: "Exam already submitted" });
      }
      
      // Ensure all questions are answered
      const examQuestions = exam.questions || [];
      const questionIds = examQuestions.map(q => q.id);
      const answeredIds = answers.map(a => a.questionId);
      
      const missingAnswers = questionIds.filter(id => !answeredIds.includes(id));
      if (missingAnswers.length > 0) {
        return res.status(400).json({ 
          message: `Not all questions are answered. Missing: ${missingAnswers.join(', ')}`,
          missingQuestions: missingAnswers
        });
      }
      
      // Calculate score
      let score = 0;
      const gradedAnswers = [];
      
      answers.forEach(answer => {
        const question = examQuestions.find(q => q.id === answer.questionId);
        if (question) {
          const isCorrect = answer.answer === question.correctAnswer;
          gradedAnswers.push({
            ...answer,
            isCorrect,
            points: isCorrect ? question.points : 0,
            correctAnswer: question.correctAnswer
          });
          
          if (isCorrect) {
            score += question.points;
          }
        }
      });
      
      // Calculate percentage score out of total points
      const totalPoints = examQuestions.reduce((sum, q) => sum + q.points, 0);
      const percentageScore = Math.round((score / totalPoints) * 100);
      
      // Submit answers
      const updatedAssignment = await storage.submitExamAnswers(id, gradedAnswers, score);
      
      // Update student stats if they exist
      try {
        await storage.updateStudentExamStats(assignment.studentId, score);
      } catch (error) {
        console.log("Could not update student stats, may not exist yet:", error);
      }
      
      return res.status(200).json(updatedAssignment);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Student stats routes
  apiRouter.get("/student-stats/:studentId", async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      // Check if student exists
      const student = await storage.getUser(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Get student stats
      const stats = await storage.getStudentStats(studentId);
      if (!stats) {
        return res.status(404).json({ message: "Student stats not found" });
      }
      
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Menu items routes - Navbar ve footer için menü öğeleri
  apiRouter.get("/menu-items", async (req: Request, res: Response) => {
    try {
      const { location } = req.query;
      const locationStr = location ? String(location) : undefined;
      const menuItems = await storage.getMenuItems(locationStr);
      return res.status(200).json(menuItems);
    } catch (error) {
      console.error("Error retrieving menu items:", error);
      return res.status(500).json({ message: "An error occurred while retrieving menu items" });
    }
  });
  
  // Site statistics endpoint is already defined at line 430
  
  // How it works steps endpoints
  apiRouter.get("/how-it-works", async (req: Request, res: Response) => {
    try {
      const steps = await storage.getHowItWorksSteps();
      return res.json(steps);
    } catch (error) {
      console.error("Error retrieving how it works steps:", error);
      return res.status(500).json({ message: "An error occurred while retrieving how it works steps" });
    }
  });

  // About us page endpoint
  apiRouter.get("/about", async (req: Request, res: Response) => {
    try {
      const aboutData = await storage.getAboutUsData();
      return res.json(aboutData);
    } catch (error) {
      console.error("Error retrieving about us data:", error);
      return res.status(500).json({ message: "An error occurred while retrieving about us data" });
    }
  });

  // Team members endpoint
  apiRouter.get("/team-members", async (req: Request, res: Response) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      return res.json(teamMembers);
    } catch (error) {
      console.error("Error retrieving team members:", error);
      return res.status(500).json({ message: "An error occurred while retrieving team members" });
    }
  });

  // Privacy policy endpoint
  apiRouter.get("/privacy", async (req: Request, res: Response) => {
    try {
      const privacyData = await storage.getPrivacyPolicy();
      return res.json(privacyData);
    } catch (error) {
      console.error("Error retrieving privacy policy:", error);
      return res.status(500).json({ message: "An error occurred while retrieving privacy policy" });
    }
  });

  // Terms of service endpoint
  apiRouter.get("/terms", async (req: Request, res: Response) => {
    try {
      const termsData = await storage.getTermsOfService();
      return res.json(termsData);
    } catch (error) {
      console.error("Error retrieving terms of service:", error);
      return res.status(500).json({ message: "An error occurred while retrieving terms of service" });
    }
  });

  // Contact page data endpoint
  apiRouter.get("/contact-page", async (req: Request, res: Response) => {
    try {
      const contactData = await storage.getContactPageData();
      return res.json(contactData);
    } catch (error) {
      console.error("Error retrieving contact page data:", error);
      return res.status(500).json({ message: "An error occurred while retrieving contact page data" });
    }
  });

  // Contact message submission endpoint
  apiRouter.post("/contact-message", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Store the contact message
      await storage.createContactMessage({ name, email, subject, message });
      
      return res.status(201).json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error creating contact message:", error);
      return res.status(500).json({ message: "An error occurred while sending your message" });
    }
  });

  return httpServer;
}
