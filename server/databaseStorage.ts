import { 
  users, 
  subjects, 
  teacherProfiles, 
  sessions,
  reviews,
  exams,
  examAssignments,
  studentStats,
  testimonials,
  appSettings,
  homepageSections,
  features,
  pricingPlans,
  faqItems,
  menuItems,
  howItWorksSteps,
  siteStatistics,
  type User,
  type Subject,
  type TeacherProfile,
  type Session,
  type Review,
  type Exam,
  type ExamAssignment,
  type StudentStat,
  type Testimonial,
  type AppSettings,
  type HomepageSection,
  type Feature,
  type PricingPlan,
  type FaqItem,
  type MenuItem,
  type InsertUser,
  type InsertSubject,
  type InsertTeacherProfile,
  type InsertSession,
  type InsertReview,
  type InsertExam,
  type InsertExamAssignment,
  type InsertStudentStats,
  type InsertTestimonial,
  type InsertAppSettings,
  type InsertHomepageSection,
  type InsertFeature,
  type InsertPricingPlan,
  type InsertFaqItem,
  type InsertMenuItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray, or } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // App settings operations
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db
      .select()
      .from(appSettings)
      .limit(1);
    return settings;
  }
  
  async updateAppSettings(settingsData: Partial<InsertAppSettings>): Promise<AppSettings> {
    // Check if settings exist
    const existingSettings = await this.getAppSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updated] = await db
        .update(appSettings)
        .set(settingsData)
        .where(eq(appSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(appSettings)
        .values(settingsData)
        .returning();
      return newSettings;
    }
  }
  
  // Pricing plans operations
  async getPricingPlans(): Promise<PricingPlan[]> {
    const plans = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.active, true))
      .orderBy(pricingPlans.order);
    return plans;
  }
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
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
    console.log(`[DATABASE] Getting sessions for teacher: ${teacherId}`);
    const result = await db.select().from(sessions).where(eq(sessions.teacherId, teacherId));
    console.log(`[DATABASE] Found ${result.length} sessions for teacher`);
    return result;
  }

  async getSessionsByStudent(studentId: string): Promise<Session[]> {
    console.log(`[DATABASE] Getting sessions for student: ${studentId}`);
    const result = await db.select().from(sessions).where(eq(sessions.studentId, studentId));
    console.log(`[DATABASE] Found ${result.length} sessions for student`);
    return result;
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

  // UI Content - Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    const testimonialsList = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.visible, true))
      .orderBy(desc(testimonials.date));
    return testimonialsList;
  }

  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const [testimonialItem] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, id));
    return testimonialItem;
  }

  async createTestimonial(testimonialData: InsertTestimonial): Promise<Testimonial> {
    const [testimonialItem] = await db
      .insert(testimonials)
      .values({
        ...testimonialData,
        date: new Date(),
      })
      .returning();
    return testimonialItem;
  }

  async updateTestimonial(id: number, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const [testimonialItem] = await db
      .update(testimonials)
      .set(testimonialData)
      .where(eq(testimonials.id, id))
      .returning();
    return testimonialItem;
  }

  // UI Content - App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db
      .select()
      .from(appSettings)
      .limit(1);
    return settings;
  }

  async updateAppSettings(settingsData: Partial<InsertAppSettings>): Promise<AppSettings> {
    // Check if settings exist
    const existingSettings = await this.getAppSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [settings] = await db
        .update(appSettings)
        .set(settingsData)
        .where(eq(appSettings.id, existingSettings.id))
        .returning();
      return settings;
    } else {
      // Create settings if not exist
      const [settings] = await db
        .insert(appSettings)
        .values(settingsData)
        .returning();
      return settings;
    }
  }

  // UI Content - Homepage Sections
  async getHomepageSections(): Promise<HomepageSection[]> {
    const sections = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.visible, true))
      .orderBy(homepageSections.order);
    return sections;
  }

  async getHomepageSection(id: number): Promise<HomepageSection | undefined> {
    const [section] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.id, id));
    return section;
  }

  async createHomepageSection(sectionData: InsertHomepageSection): Promise<HomepageSection> {
    const [section] = await db
      .insert(homepageSections)
      .values(sectionData)
      .returning();
    return section;
  }

  async updateHomepageSection(id: number, sectionData: Partial<InsertHomepageSection>): Promise<HomepageSection | undefined> {
    const [section] = await db
      .update(homepageSections)
      .set(sectionData)
      .where(eq(homepageSections.id, id))
      .returning();
    return section;
  }

  // UI Content - Features
  async getFeatures(): Promise<Feature[]> {
    const featuresList = await db
      .select()
      .from(features)
      .where(eq(features.visible, true))
      .orderBy(features.order_position);
    return featuresList;
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    const [feature] = await db
      .select()
      .from(features)
      .where(eq(features.id, id));
    return feature;
  }

  async createFeature(featureData: InsertFeature): Promise<Feature> {
    const [feature] = await db
      .insert(features)
      .values(featureData)
      .returning();
    return feature;
  }

  async updateFeature(id: number, featureData: Partial<InsertFeature>): Promise<Feature | undefined> {
    const [feature] = await db
      .update(features)
      .set(featureData)
      .where(eq(features.id, id))
      .returning();
    return feature;
  }

  // UI Content - Pricing Plans
  async getPricingPlans(): Promise<PricingPlan[]> {
    const plans = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.active, true))
      .orderBy(pricingPlans.order);
    return plans;
  }

  async getPricingPlan(id: number): Promise<PricingPlan | undefined> {
    const [plan] = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.id, id));
    return plan;
  }

  async createPricingPlan(planData: InsertPricingPlan): Promise<PricingPlan> {
    const [plan] = await db
      .insert(pricingPlans)
      .values(planData)
      .returning();
    return plan;
  }

  async updatePricingPlan(id: number, planData: Partial<InsertPricingPlan>): Promise<PricingPlan | undefined> {
    const [plan] = await db
      .update(pricingPlans)
      .set(planData)
      .where(eq(pricingPlans.id, id))
      .returning();
    return plan;
  }

  // UI Content - FAQ Items
  async getFaqItems(category?: string): Promise<FaqItem[]> {
    let query = db
      .select()
      .from(faqItems)
      .where(eq(faqItems.visible, true));
      
    if (category) {
      query = query.where(eq(faqItems.category, category));
    }
      
    const items = await query.orderBy(faqItems.order);
    return items;
  }

  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    const [item] = await db
      .select()
      .from(faqItems)
      .where(eq(faqItems.id, id));
    return item;
  }

  async createFaqItem(itemData: InsertFaqItem): Promise<FaqItem> {
    const [item] = await db
      .insert(faqItems)
      .values(itemData)
      .returning();
    return item;
  }

  async updateFaqItem(id: number, itemData: Partial<InsertFaqItem>): Promise<FaqItem | undefined> {
    const [item] = await db
      .update(faqItems)
      .set(itemData)
      .where(eq(faqItems.id, id))
      .returning();
    return item;
  }
  
  // UI Content - Menu Items
  async getMenuItems(location?: string): Promise<MenuItem[]> {
    let query = db
      .select()
      .from(menuItems)
      .where(eq(menuItems.visible, true));
      
    if (location) {
      query = query.where(eq(menuItems.menuLocation, location));
    }
    
    const menuList = await query.orderBy(menuItems.order_position);
    return menuList;
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));
    return item;
  }
  
  async createMenuItem(itemData: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db
      .insert(menuItems)
      .values(itemData)
      .returning();
    return item;
  }
  
  async updateMenuItem(id: number, itemData: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [item] = await db
      .update(menuItems)
      .set(itemData)
      .where(eq(menuItems.id, id))
      .returning();
    return item;
  }
  
  // Site statistics operations
  async getSiteStatistics(): Promise<any> {
    try {
      // Use raw SQL with aliases to handle column name case sensitivity
      const result = await db.execute(sql`
        SELECT 
          id,
          totalstudents AS "totalStudents", 
          totalteachers AS "totalTeachers", 
          totalsubjects AS "totalSubjects", 
          totalsessions AS "totalSessions", 
          lastupdated AS "lastUpdated"
        FROM site_statistics
        LIMIT 1
      `);
      
      if (result.rowCount === 0) {
        // Return default statistics if no record exists
        return {
          totalStudents: 1250,
          totalTeachers: 380,
          totalSubjects: 24,
          totalSessions: 8500,
          lastUpdated: new Date()
        };
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error getting site statistics:", error);
      
      // Provide default statistics if table doesn't exist yet
      return {
        totalStudents: 1250,
        totalTeachers: 380,
        totalSubjects: 24,
        totalSessions: 8500,
        lastUpdated: new Date()
      };
    }
  }
  
  async updateSiteStatistics(data: any): Promise<any> {
    try {
      const [stats] = await db
        .select()
        .from(siteStatistics)
        .limit(1);
      
      if (!stats) {
        // Create first statistics record if none exists
        const [newStats] = await db
          .insert(siteStatistics)
          .values({
            ...data,
            lastUpdated: new Date()
          })
          .returning();
        return newStats;
      }
      
      // Update existing record
      const [updatedStats] = await db
        .update(siteStatistics)
        .set({
          ...data,
          lastUpdated: new Date()
        })
        .where(eq(siteStatistics.id, stats.id))
        .returning();
      
      return updatedStats;
    } catch (error) {
      console.error("Error updating site statistics:", error);
      throw error;
    }
  }
  
  // How it works operations
  async getHowItWorksSteps(): Promise<any[]> {
    try {
      // Check if the how_it_works_steps table exists
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'how_it_works_steps'
        );
      `);
      
      const tableExists = result.rows[0].exists;
      
      if (tableExists) {
        // Get steps from the database
        const stepsResult = await db.execute(sql`
          SELECT id, number, title, description, icon, order_index 
          FROM how_it_works_steps 
          ORDER BY order_index ASC
        `);
        
        if (stepsResult.rowCount > 0) {
          return stepsResult.rows;
        }
      }
      
      // Return default steps if table doesn't exist or no records found
      return [
        {
          id: 1,
          number: 1,
          title: "Find Your Teacher",
          description: "Browse through our selection of verified teachers based on subject, price, and ratings to find your perfect match.",
          icon: "search",
          order_index: 1
        },
        {
          id: 2,
          number: 2,
          title: "Schedule a Session",
          description: "Book a session at a time that works for you. Our flexible scheduling system makes it easy to find a convenient time.",
          icon: "calendar",
          order_index: 2
        },
        {
          id: 3,
          number: 3,
          title: "Learn and Grow",
          description: "Connect through our integrated video platform for interactive lessons. Track your progress and get personalized feedback.",
          icon: "video",
          order_index: 3
        }
      ];
    } catch (error) {
      console.error("Error getting how it works steps:", error);
      // Return default steps on error
      return [
        {
          id: 1,
          number: 1,
          title: "Find Your Teacher",
          description: "Browse through our selection of verified teachers based on subject, price, and ratings to find your perfect match.",
          icon: "search",
          order_index: 1
        },
        {
          id: 2,
          number: 2,
          title: "Schedule a Session",
          description: "Book a session at a time that works for you. Our flexible scheduling system makes it easy to find a convenient time.",
          icon: "calendar",
          order_index: 2
        },
        {
          id: 3,
          number: 3,
          title: "Learn and Grow",
          description: "Connect through our integrated video platform for interactive lessons. Track your progress and get personalized feedback.",
          icon: "video",
          order_index: 3
        }
      ];
    }
  }
  
  async createHowItWorksStep(data: any): Promise<any> {
    try {
      const [step] = await db
        .insert(howItWorksSteps)
        .values(data)
        .returning();
      
      return step;
    } catch (error) {
      console.error("Error creating how it works step:", error);
      throw error;
    }
  }
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
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
  
  // Site statistics operations
  getSiteStatistics(): Promise<any>;
  updateSiteStatistics(data: any): Promise<any>;
  
  // How it works operations
  getHowItWorksSteps(): Promise<any[]>;
  createHowItWorksStep(data: any): Promise<any>;
}

export const storage = new DatabaseStorage();