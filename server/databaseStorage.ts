import { 
  users, 
  subjects, 
  teacherProfiles, 
  sessions,
  reviews,
  exams,
  examAssignments,
  studentStats,
  type User,
  type Subject,
  type TeacherProfile,
  type Session,
  type Review,
  type Exam,
  type ExamAssignment,
  type StudentStat,
  type InsertUser,
  type InsertSubject,
  type InsertTeacherProfile,
  type InsertSession,
  type InsertReview,
  type InsertExam,
  type InsertExamAssignment,
  type InsertStudentStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, or } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // Subject operations
  async getSubjects(): Promise<Subject[]> {
    return db.select().from(subjects);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(subjects)
      .values(subjectData)
      .returning();
    return subject;
  }
  
  // Teacher profile operations
  async getTeacherProfile(id: number): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, id));
    return profile;
  }

  async getTeacherProfileByUserId(userId: string): Promise<TeacherProfile | undefined> {
    const [profile] = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId));
    return profile;
  }

  async createTeacherProfile(profileData: InsertTeacherProfile): Promise<TeacherProfile> {
    const [profile] = await db
      .insert(teacherProfiles)
      .values(profileData)
      .returning();
    return profile;
  }

  async getTeacherProfiles(): Promise<TeacherProfile[]> {
    const profiles = await db
      .select()
      .from(teacherProfiles)
      .orderBy(desc(teacherProfiles.averageRating));
    
    return profiles;
  }

  async getTeachersBySubject(subjectId: number): Promise<TeacherProfile[]> {
    // This uses JSON containment operator @> to check if subjectIds array contains the subjectId
    const profiles = await db.query.teacherProfiles.findMany({
      where: sql`${teacherProfiles.subjectIds}::jsonb @> ${[subjectId]}::jsonb`,
    });
    
    return profiles;
  }
  
  // Session operations
  async getSessions(): Promise<Session[]> {
    return db.select().from(sessions);
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getSessionsByTeacher(teacherId: string): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.teacherId, teacherId));
  }

  async getSessionsByStudent(studentId: string): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.studentId, studentId));
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateSessionStatus(id: number, status: string): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set({ status })
      .where(eq(sessions.id, id))
      .returning();
    
    return updatedSession;
  }
  
  // Review operations
  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews);
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByTeacher(teacherId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.teacherId, teacherId));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
      
    // Update teacher rating
    const teacherId = reviewData.teacherId;
    const teacherReviews = await this.getReviewsByTeacher(teacherId);
    
    if (teacherReviews.length > 0) {
      const totalRating = teacherReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / teacherReviews.length;
      
      // Get teacher profile by user ID
      const teacherProfile = await this.getTeacherProfileByUserId(teacherId);
      
      if (teacherProfile) {
        await db
          .update(teacherProfiles)
          .set({ 
            averageRating, 
            totalReviews: teacherReviews.length 
          })
          .where(eq(teacherProfiles.id, teacherProfile.id));
      }
    }
    
    return review;
  }
  
  // Exam operations
  async getExams(): Promise<Exam[]> {
    return db.select().from(exams);
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    return db.select().from(exams).where(eq(exams.teacherId, teacherId));
  }

  async createExam(examData: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(examData)
      .returning();
    return exam;
  }
  
  // Exam assignment operations
  async getExamAssignments(): Promise<ExamAssignment[]> {
    return db.select().from(examAssignments);
  }

  async getExamAssignment(id: number): Promise<ExamAssignment | undefined> {
    const [assignment] = await db.select().from(examAssignments).where(eq(examAssignments.id, id));
    return assignment;
  }

  async getExamAssignmentsByStudent(studentId: string): Promise<ExamAssignment[]> {
    return db.select().from(examAssignments).where(eq(examAssignments.studentId, studentId));
  }

  async createExamAssignment(assignmentData: InsertExamAssignment): Promise<ExamAssignment> {
    const [assignment] = await db
      .insert(examAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async submitExamAnswers(id: number, answers: any[], score: number): Promise<ExamAssignment | undefined> {
    const [updatedAssignment] = await db
      .update(examAssignments)
      .set({ 
        answers, 
        score, 
        completed: true, 
        submittedAt: new Date() 
      })
      .where(eq(examAssignments.id, id))
      .returning();
    
    // Update student stats
    if (updatedAssignment) {
      await this.updateStudentExamStats(updatedAssignment.studentId, score);
    }
    
    return updatedAssignment;
  }
  
  // Student stats operations
  async getStudentStats(studentId: string): Promise<StudentStat | undefined> {
    const [stats] = await db.select().from(studentStats).where(eq(studentStats.studentId, studentId));
    return stats;
  }

  async createStudentStats(statsData: InsertStudentStats): Promise<StudentStat> {
    const [stats] = await db
      .insert(studentStats)
      .values(statsData)
      .returning();
    return stats;
  }

  async updateStudentActivity(studentId: string): Promise<StudentStat | undefined> {
    // Get or create student stats
    let stats = await this.getStudentStats(studentId);
    
    if (!stats) {
      stats = await this.createStudentStats({ studentId });
    }
    
    const [updatedStats] = await db
      .update(studentStats)
      .set({ lastActivity: new Date() })
      .where(eq(studentStats.studentId, studentId))
      .returning();
    
    return updatedStats;
  }

  async updateStudentSessionCount(studentId: string): Promise<StudentStat | undefined> {
    // Get or create student stats
    let stats = await this.getStudentStats(studentId);
    
    if (!stats) {
      stats = await this.createStudentStats({ studentId });
    }
    
    // Get total sessions
    const userSessions = await this.getSessionsByStudent(studentId);
    const completedSessions = userSessions.filter(s => s.status === "completed").length;
    
    const [updatedStats] = await db
      .update(studentStats)
      .set({ 
        totalSessionsAttended: completedSessions,
        lastActivity: new Date() 
      })
      .where(eq(studentStats.studentId, studentId))
      .returning();
    
    return updatedStats;
  }

  async updateStudentExamStats(studentId: string, score: number): Promise<StudentStat | undefined> {
    // Get or create student stats
    let stats = await this.getStudentStats(studentId);
    
    if (!stats) {
      stats = await this.createStudentStats({ studentId });
    }
    
    // Get all completed exams
    const studentAssignments = await this.getExamAssignmentsByStudent(studentId);
    const completedAssignments = studentAssignments.filter(a => a.completed);
    
    // Calculate new average score
    const totalScore = completedAssignments.reduce((sum, a) => sum + (a.score || 0), 0);
    const averageScore = completedAssignments.length > 0 
      ? totalScore / completedAssignments.length 
      : 0;
    
    const [updatedStats] = await db
      .update(studentStats)
      .set({ 
        totalExamsCompleted: completedAssignments.length,
        averageExamScore: averageScore,
        lastActivity: new Date() 
      })
      .where(eq(studentStats.studentId, studentId))
      .returning();
    
    return updatedStats;
  }
}

// Interface for storage operations
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

export const storage = new DatabaseStorage();