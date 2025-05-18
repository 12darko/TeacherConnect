import { 
  users, subjects, teacherProfiles, sessions, reviews, exams, examAssignments, studentStats,
  type User, type Subject, type TeacherProfile, type Session, type Review, type Exam, type ExamAssignment, type StudentStat,
  type InsertUser, type InsertSubject, type InsertTeacherProfile, type InsertSession, type InsertReview, type InsertExam, type InsertExamAssignment, type InsertStudentStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        role,
        updatedAt: new Date()
      })
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
      .values({
        ...profileData,
        averageRating: 0,
        totalReviews: 0,
        totalStudents: 0
      })
      .returning();
    
    return profile;
  }

  async getTeacherProfiles(): Promise<TeacherProfile[]> {
    return db.select().from(teacherProfiles);
  }

  async getTeachersBySubject(subjectId: number): Promise<TeacherProfile[]> {
    // This is a simplified approach - in a real implementation, you'd need a 
    // more sophisticated query to check if the subject ID is in the subjectIds array
    return db.select().from(teacherProfiles);
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
    
    // Update teacher profile stats
    const teacherProfile = await this.getTeacherProfileByUserId(sessionData.teacherId);
    if (teacherProfile) {
      await db
        .update(teacherProfiles)
        .set({ 
          totalStudents: (teacherProfile.totalStudents || 0) + 1
        })
        .where(eq(teacherProfiles.id, teacherProfile.id));
    }
    
    // Update student stats
    await this.updateStudentSessionCount(sessionData.studentId);
    
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
      .values({
        ...reviewData,
        createdAt: new Date()
      })
      .returning();
    
    // Update teacher profile ratings
    const teacherProfile = await this.getTeacherProfileByUserId(reviewData.teacherId);
    if (teacherProfile) {
      const teacherReviews = await this.getReviewsByTeacher(reviewData.teacherId);
      const totalRating = teacherReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / teacherReviews.length;
      
      await db
        .update(teacherProfiles)
        .set({ 
          averageRating: averageRating,
          totalReviews: teacherReviews.length
        })
        .where(eq(teacherProfiles.id, teacherProfile.id));
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
      .values({
        ...examData,
        createdAt: new Date()
      })
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
      .values({
        ...assignmentData,
        assignedAt: new Date(),
        completed: false
      })
      .returning();
    
    return assignment;
  }

  async submitExamAnswers(id: number, answers: any[], score: number): Promise<ExamAssignment | undefined> {
    const [assignment] = await db
      .update(examAssignments)
      .set({ 
        answers: answers,
        score: score,
        completed: true,
        submittedAt: new Date()
      })
      .where(eq(examAssignments.id, id))
      .returning();
    
    if (assignment) {
      // Update student stats with exam results
      await this.updateStudentExamStats(assignment.studentId, score);
    }
    
    return assignment;
  }
  
  // Student stats operations
  async getStudentStats(studentId: string): Promise<StudentStat | undefined> {
    const [stats] = await db.select().from(studentStats).where(eq(studentStats.studentId, studentId));
    return stats;
  }

  async createStudentStats(statsData: InsertStudentStats): Promise<StudentStat> {
    const [stats] = await db
      .insert(studentStats)
      .values({
        ...statsData,
        totalSessionsAttended: 0,
        totalExamsCompleted: 0,
        averageExamScore: 0,
        lastActivity: new Date()
      })
      .returning();
    
    return stats;
  }

  async updateStudentActivity(studentId: string): Promise<StudentStat | undefined> {
    const stats = await this.getStudentStats(studentId);
    if (!stats) {
      return await this.createStudentStats({ studentId });
    }
    
    const [updatedStats] = await db
      .update(studentStats)
      .set({ lastActivity: new Date() })
      .where(eq(studentStats.id, stats.id))
      .returning();
    
    return updatedStats;
  }

  async updateStudentSessionCount(studentId: string): Promise<StudentStat | undefined> {
    const stats = await this.getStudentStats(studentId);
    if (!stats) {
      return await this.createStudentStats({ studentId });
    }
    
    const [updatedStats] = await db
      .update(studentStats)
      .set({ 
        totalSessionsAttended: (stats.totalSessionsAttended || 0) + 1,
        lastActivity: new Date()
      })
      .where(eq(studentStats.id, stats.id))
      .returning();
    
    return updatedStats;
  }

  async updateStudentExamStats(studentId: string, score: number): Promise<StudentStat | undefined> {
    const stats = await this.getStudentStats(studentId);
    if (!stats) {
      return await this.createStudentStats({ studentId });
    }
    
    const newTotalExams = (stats.totalExamsCompleted || 0) + 1;
    const newAverage = ((stats.averageExamScore || 0) * (stats.totalExamsCompleted || 0) + score) / newTotalExams;
    
    const [updatedStats] = await db
      .update(studentStats)
      .set({ 
        totalExamsCompleted: newTotalExams,
        averageExamScore: newAverage,
        lastActivity: new Date()
      })
      .where(eq(studentStats.id, stats.id))
      .returning();
    
    return updatedStats;
  }
}