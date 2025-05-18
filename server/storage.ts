import { 
  users, subjects, teacherProfiles, sessions, reviews, exams, examAssignments, studentStats,
  type User, type Subject, type TeacherProfile, type Session, type Review, type Exam, type ExamAssignment, type StudentStat,
  type InsertUser, type InsertSubject, type InsertTeacherProfile, type InsertSession, type InsertReview, type InsertExam, type InsertExamAssignment, type InsertStudentStats
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: any): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Subject operations
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Teacher profile operations
  getTeacherProfile(id: number): Promise<TeacherProfile | undefined>;
  getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined>;
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  getTeacherProfiles(): Promise<TeacherProfile[]>;
  getTeachersBySubject(subjectId: number): Promise<TeacherProfile[]>;
  
  // Session operations
  getSessions(): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  getSessionsByTeacher(teacherId: string): Promise<Session[]>;
  getSessionsByStudent(studentId: string): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSessionStatus(id: number, status: string): Promise<Session | undefined>;
  
  // Review operations
  getReviews(): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByTeacher(teacherId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Exam operations
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByTeacher(teacherId: string): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  
  // Exam assignment operations
  getExamAssignments(): Promise<ExamAssignment[]>;
  getExamAssignment(id: number): Promise<ExamAssignment | undefined>;
  getExamAssignmentsByStudent(studentId: string): Promise<ExamAssignment[]>;
  createExamAssignment(assignment: InsertExamAssignment): Promise<ExamAssignment>;
  submitExamAnswers(id: number, answers: any[], score: number): Promise<ExamAssignment | undefined>;
  
  // Student stats operations
  getStudentStats(studentId: string): Promise<StudentStat | undefined>;
  createStudentStats(stats: InsertStudentStats): Promise<StudentStat>;
  updateStudentActivity(studentId: string): Promise<StudentStat | undefined>;
  updateStudentSessionCount(studentId: string): Promise<StudentStat | undefined>;
  updateStudentExamStats(studentId: string, score: number): Promise<StudentStat | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subjects: Map<number, Subject>;
  private teacherProfiles: Map<number, TeacherProfile>;
  private sessions: Map<number, Session>;
  private reviews: Map<number, Review>;
  private exams: Map<number, Exam>;
  private examAssignments: Map<number, ExamAssignment>;
  private studentStats: Map<number, StudentStat>;
  
  private userIdCounter: number;
  private subjectIdCounter: number;
  private teacherProfileIdCounter: number;
  private sessionIdCounter: number;
  private reviewIdCounter: number;
  private examIdCounter: number;
  private examAssignmentIdCounter: number;
  private studentStatsIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.teacherProfiles = new Map();
    this.sessions = new Map();
    this.reviews = new Map();
    this.exams = new Map();
    this.examAssignments = new Map();
    this.studentStats = new Map();
    
    this.userIdCounter = 1;
    this.subjectIdCounter = 1;
    this.teacherProfileIdCounter = 1;
    this.sessionIdCounter = 1;
    this.reviewIdCounter = 1;
    this.examIdCounter = 1;
    this.examAssignmentIdCounter = 1;
    this.studentStatsIdCounter = 1;
    
    // Initialize with sample data
    this.initSampleData();
  }
  
  private initSampleData() {
    // Add some sample subjects
    const sampleSubjects = [
      { name: "Mathematics", icon: "functions" },
      { name: "Science", icon: "science" },
      { name: "Languages", icon: "language" },
      { name: "History", icon: "history_edu" },
      { name: "Computer Science", icon: "computer" }
    ];
    
    sampleSubjects.forEach(subject => {
      this.createSubject(subject);
    });
  }
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.id === id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async upsertUser(userData: any): Promise<User> {
    // Use provided ID or generate a UUID-like number as string
    const id = userData.id || `user_${this.userIdCounter++}`;
    const now = new Date();
    
    const user: User = { 
      ...userData,
      id, 
      createdAt: userData.createdAt || now,
      updatedAt: now
    };
    
    // Store using string ID as key
    this.users.set(id, user);
    
    // If the user is a student, initialize their stats
    if (userData.role === 'student') {
      await this.createStudentStats({ studentId: id });
    }
    
    return user;
  }
  
  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { 
      ...user, 
      role,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Subject operations
  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }
  
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }
  
  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const subject: Subject = { ...subjectData, id };
    this.subjects.set(id, subject);
    return subject;
  }
  
  // Teacher profile operations
  async getTeacherProfile(id: number): Promise<TeacherProfile | undefined> {
    return this.teacherProfiles.get(id);
  }
  
  async getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined> {
    return Array.from(this.teacherProfiles.values()).find(profile => profile.userId === userId);
  }
  
  async createTeacherProfile(profileData: InsertTeacherProfile): Promise<TeacherProfile> {
    const id = this.teacherProfileIdCounter++;
    const profile: TeacherProfile = { 
      ...profileData, 
      id, 
      averageRating: 0, 
      totalReviews: 0, 
      totalStudents: 0 
    };
    this.teacherProfiles.set(id, profile);
    return profile;
  }
  
  async getTeacherProfiles(): Promise<TeacherProfile[]> {
    return Array.from(this.teacherProfiles.values());
  }
  
  async getTeachersBySubject(subjectId: number): Promise<TeacherProfile[]> {
    return Array.from(this.teacherProfiles.values())
      .filter(profile => Array.isArray(profile.subjectIds) && profile.subjectIds.includes(subjectId));
  }
  
  // Session operations
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }
  
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }
  
  async getSessionsByTeacher(teacherId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.teacherId === teacherId);
  }
  
  async getSessionsByStudent(studentId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.studentId === studentId);
  }
  
  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const session: Session = { 
      ...sessionData, 
      id,
      sessionUrl: sessionData.sessionUrl || null
    };
    this.sessions.set(id, session);
    
    // Update teacher's total students
    const teacherProfile = await this.getTeacherProfileByUserId(sessionData.teacherId);
    if (teacherProfile) {
      const updatedProfile = { 
        ...teacherProfile, 
        totalStudents: (teacherProfile.totalStudents || 0) + 1 
      };
      this.teacherProfiles.set(teacherProfile.id, updatedProfile);
    }
    
    // Update student stats
    await this.updateStudentActivity(sessionData.studentId);
    
    return session;
  }
  
  async updateSessionStatus(id: number, status: string): Promise<Session | undefined> {
    const session = await this.getSession(id);
    if (!session) return undefined;
    
    const updatedSession: Session = { ...session, status };
    this.sessions.set(id, updatedSession);
    
    // If session is completed, update student stats
    if (status === 'completed') {
      await this.updateStudentSessionCount(session.studentId);
    }
    
    return updatedSession;
  }
  
  // Review operations
  async getReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values());
  }
  
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }
  
  async getReviewsByTeacher(teacherId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.teacherId === teacherId);
  }
  
  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const now = new Date();
    const review: Review = { 
      ...reviewData, 
      id, 
      createdAt: now,
      comment: reviewData.comment || null
    };
    this.reviews.set(id, review);
    
    // Update teacher's average rating
    const teacherProfile = await this.getTeacherProfileByUserId(reviewData.teacherId);
    if (teacherProfile) {
      const reviews = await this.getReviewsByTeacher(reviewData.teacherId);
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const updatedProfile = { 
        ...teacherProfile, 
        averageRating, 
        totalReviews: reviews.length 
      };
      this.teacherProfiles.set(teacherProfile.id, updatedProfile);
    }
    
    return review;
  }
  
  // Exam operations
  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }
  
  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }
  
  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    return Array.from(this.exams.values())
      .filter(exam => exam.teacherId === teacherId);
  }
  
  async createExam(examData: InsertExam): Promise<Exam> {
    const id = this.examIdCounter++;
    const now = new Date();
    const exam: Exam = { 
      ...examData, 
      id, 
      createdAt: now,
      description: examData.description || null
    };
    this.exams.set(id, exam);
    return exam;
  }
  
  // Exam assignment operations
  async getExamAssignments(): Promise<ExamAssignment[]> {
    return Array.from(this.examAssignments.values());
  }
  
  async getExamAssignment(id: number): Promise<ExamAssignment | undefined> {
    return this.examAssignments.get(id);
  }
  
  async getExamAssignmentsByStudent(studentId: string): Promise<ExamAssignment[]> {
    return Array.from(this.examAssignments.values())
      .filter(assignment => assignment.studentId === studentId);
  }
  
  async createExamAssignment(assignmentData: InsertExamAssignment): Promise<ExamAssignment> {
    const id = this.examAssignmentIdCounter++;
    const now = new Date();
    const assignment: ExamAssignment = { 
      ...assignmentData, 
      id, 
      assignedAt: now, 
      completed: false,
      answers: null,
      score: null,
      submittedAt: null
    };
    this.examAssignments.set(id, assignment);
    
    // Update student activity
    await this.updateStudentActivity(assignmentData.studentId);
    
    return assignment;
  }
  
  async submitExamAnswers(id: number, answers: any[], score: number): Promise<ExamAssignment | undefined> {
    const assignment = await this.getExamAssignment(id);
    if (!assignment) return undefined;
    
    const now = new Date();
    const updatedAssignment: ExamAssignment = { 
      ...assignment, 
      completed: true, 
      answers, 
      score, 
      submittedAt: now 
    };
    this.examAssignments.set(id, updatedAssignment);
    
    // Update student stats
    await this.updateStudentExamStats(assignment.studentId, score);
    
    return updatedAssignment;
  }
  
  // Student stats operations
  async getStudentStats(studentId: string): Promise<StudentStat | undefined> {
    return Array.from(this.studentStats.values())
      .find(stats => stats.studentId === studentId);
  }
  
  async createStudentStats(statsData: InsertStudentStats): Promise<StudentStat> {
    const id = this.studentStatsIdCounter++;
    const now = new Date();
    const stats: StudentStat = { 
      ...statsData, 
      id, 
      totalSessionsAttended: 0, 
      totalExamsCompleted: 0, 
      averageExamScore: 0, 
      lastActivity: now 
    };
    this.studentStats.set(id, stats);
    return stats;
  }
  
  async updateStudentActivity(studentId: string): Promise<StudentStat | undefined> {
    const stats = await this.getStudentStats(studentId);
    if (!stats) {
      return await this.createStudentStats({ studentId });
    }
    
    const now = new Date();
    const updatedStats: StudentStat = { ...stats, lastActivity: now };
    this.studentStats.set(stats.id, updatedStats);
    return updatedStats;
  }
  
  async updateStudentSessionCount(studentId: string): Promise<StudentStat | undefined> {
    const stats = await this.getStudentStats(studentId);
    if (!stats) {
      return await this.createStudentStats({ studentId });
    }
    
    const now = new Date();
    const updatedStats: StudentStat = { 
      ...stats, 
      lastActivity: now,
      totalSessionsAttended: (stats.totalSessionsAttended || 0) + 1
    };
    this.studentStats.set(stats.id, updatedStats);
    return updatedStats;
  }
  
  async updateStudentExamStats(studentId: string, score: number): Promise<StudentStat | undefined> {
    const stats = await this.getStudentStats(studentId);
    if (!stats) {
      return await this.createStudentStats({ studentId });
    }
    
    const now = new Date();
    
    // Calculate new average
    const totalExams = (stats.totalExamsCompleted || 0) + 1;
    const totalScore = (stats.averageExamScore || 0) * (stats.totalExamsCompleted || 0) + score;
    const newAverage = totalScore / totalExams;
    
    const updatedStats: StudentStat = { 
      ...stats, 
      lastActivity: now,
      totalExamsCompleted: totalExams,
      averageExamScore: newAverage
    };
    this.studentStats.set(stats.id, updatedStats);
    return updatedStats;
  }
}

// Import and use DatabaseStorage for production
import { DatabaseStorage } from "./databaseStorage";
export const storage = new DatabaseStorage();
