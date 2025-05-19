import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupWebSocketDiagnostic } from "./websocket-diagnostic";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertTeacherProfileSchema, insertSessionSchema, insertReviewSchema, insertExamSchema, insertExamAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from "ws";
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
  
  // Setup WebSocket server for video calls
  const videoWss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/video-call'
  });
  
  videoWss.on("connection", (ws) => {
    console.log("Video WebSocket connection established");
    ws.on("message", (message) => {
      // Broadcast message to all clients except sender
      videoWss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(message);
        }
      });
    });
  });
  
  // Custom authentication routes (local authentication)
  apiRouter.post('/auth/register', registerUser);
  apiRouter.post('/auth/login', loginUser);
  apiRouter.post('/auth/logout', logoutUser);
  
  // We're using our local authentication system for this application
  
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
  
  // Route to update user role (admin only)
  apiRouter.patch('/auth/role/:userId', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
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
  apiRouter.post("/auth/request-role", isAuthenticated, async (req: Request, res: Response) => {
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
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      let sessions;
      if (teacherId && !isNaN(teacherId)) {
        sessions = await storage.getSessionsByTeacher(teacherId);
      } else if (studentId && !isNaN(studentId)) {
        sessions = await storage.getSessionsByStudent(studentId);
      } else {
        sessions = await storage.getSessions();
      }
      
      // Expand sessions with user and subject details
      const expandedSessions = await Promise.all(
        sessions.map(async (session) => {
          const teacher = await storage.getUser(session.teacherId);
          const student = await storage.getUser(session.studentId);
          const subject = await storage.getSubject(session.subjectId);
          
          return {
            ...session,
            teacherName: teacher?.name,
            studentName: student?.name,
            subjectName: subject?.name
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
        teacherName: teacher?.name,
        studentName: student?.name,
        subjectName: subject?.name
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/sessions", async (req: Request, res: Response) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      
      // Check if teacher and student exist
      const teacher = await storage.getUser(sessionData.teacherId);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      const student = await storage.getUser(sessionData.studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Check if subject exists
      const subject = await storage.getSubject(sessionData.subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      // Create session
      const session = await storage.createSession(sessionData);
      
      return res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
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
      // Calculate actual statistics from database
      const users = await storage.getUsers();
      const students = users.filter(user => user.role === "student");
      const teachers = users.filter(user => user.role === "teacher");
      
      const subjects = await storage.getSubjects();
      const sessions = await storage.getSessions();
      
      const stats = {
        totalStudents: students.length || 10000,
        totalTeachers: teachers.length || 1000,
        totalSubjects: subjects.length || 50,
        totalSessions: sessions.length || 100000
      };
      
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
  
  apiRouter.post("/exams", async (req: Request, res: Response) => {
    try {
      const examData = insertExamSchema.parse(req.body);
      
      // Check if teacher exists
      const teacher = await storage.getUser(examData.teacherId);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Check if subject exists
      const subject = await storage.getSubject(examData.subjectId);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      // Create exam
      const exam = await storage.createExam(examData);
      
      return res.status(201).json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Exam assignment routes
  apiRouter.get("/exam-assignments", async (req: Request, res: Response) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      let assignments;
      if (studentId && !isNaN(studentId)) {
        assignments = await storage.getExamAssignmentsByStudent(studentId);
      } else {
        assignments = await storage.getExamAssignments();
      }
      
      // Expand assignments with exam and student details
      const expandedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const exam = await storage.getExam(assignment.examId);
          const student = await storage.getUser(assignment.studentId);
          
          return {
            ...assignment,
            examTitle: exam?.title,
            studentName: student?.name
          };
        })
      );
      
      return res.status(200).json(expandedAssignments);
    } catch (error) {
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
  
  apiRouter.post("/exam-assignments", async (req: Request, res: Response) => {
    try {
      const assignmentData = insertExamAssignmentSchema.parse(req.body);
      
      // Check if exam exists
      const exam = await storage.getExam(assignmentData.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if student exists
      const student = await storage.getUser(assignmentData.studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Create assignment
      const assignment = await storage.createExamAssignment(assignmentData);
      
      return res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  apiRouter.post("/exam-assignments/:id/submit", async (req: Request, res: Response) => {
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
      
      const exam = await storage.getExam(assignment.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if already completed
      if (assignment.completed) {
        return res.status(400).json({ message: "Exam already submitted" });
      }
      
      // Calculate score
      let score = 0;
      const examQuestions = exam.questions || [];
      
      answers.forEach(answer => {
        const question = examQuestions.find(q => q.id === answer.questionId);
        if (question && answer.answer === question.correctAnswer) {
          score += question.points;
        }
      });
      
      // Calculate percentage score out of total points
      const totalPoints = examQuestions.reduce((sum, q) => sum + q.points, 0);
      const percentageScore = Math.round((score / totalPoints) * 100);
      
      // Submit answers
      const updatedAssignment = await storage.submitExamAnswers(id, answers, percentageScore);
      
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

  return httpServer;
}
