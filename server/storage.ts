import { 
  users, subjects, teacherProfiles, sessions, reviews, exams, examAssignments, studentStats,
  testimonials, appSettings, homepageSections, features, pricingPlans, faqItems,
  type User, type Subject, type TeacherProfile, type Session, type Review, type Exam, type ExamAssignment, type StudentStat,
  type Testimonial, type AppSettings, type HomepageSection, type Feature, type PricingPlan, type FaqItem,
  type InsertUser, type InsertSubject, type InsertTeacherProfile, type InsertSession, type InsertReview, type InsertExam, type InsertExamAssignment, type InsertStudentStats,
  type InsertTestimonial, type InsertAppSettings, type InsertHomepageSection, type InsertFeature, type InsertPricingPlan, type InsertFaqItem
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
  
  // UI Content - Testimonials
  getTestimonials(): Promise<Testimonial[]>;
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: number, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  
  // UI Content - App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<InsertAppSettings>): Promise<AppSettings>;
  
  // UI Content - Homepage Sections
  getHomepageSections(): Promise<HomepageSection[]>;
  getHomepageSection(id: number): Promise<HomepageSection | undefined>;
  createHomepageSection(section: InsertHomepageSection): Promise<HomepageSection>;
  updateHomepageSection(id: number, section: Partial<InsertHomepageSection>): Promise<HomepageSection | undefined>;
  
  // UI Content - Features
  getFeatures(): Promise<Feature[]>;
  getFeature(id: number): Promise<Feature | undefined>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: number, feature: Partial<InsertFeature>): Promise<Feature | undefined>;
  
  // UI Content - Pricing Plans
  getPricingPlans(): Promise<PricingPlan[]>;
  getPricingPlan(id: number): Promise<PricingPlan | undefined>;
  createPricingPlan(plan: InsertPricingPlan): Promise<PricingPlan>;
  updatePricingPlan(id: number, plan: Partial<InsertPricingPlan>): Promise<PricingPlan | undefined>;
  
  // UI Content - FAQ Items
  getFaqItems(): Promise<FaqItem[]>;
  getFaqItem(id: number): Promise<FaqItem | undefined>;
  createFaqItem(item: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(id: number, item: Partial<InsertFaqItem>): Promise<FaqItem | undefined>;
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
  private testimonialIdCounter: number;
  private appSettingsIdCounter: number;
  private homepageSectionIdCounter: number;
  private featureIdCounter: number;
  private pricingPlanIdCounter: number;
  private faqItemIdCounter: number;
  
  // UI components
  private testimonials: Map<number, Testimonial>;
  private appSettingsData: Map<number, AppSettings>;
  private homepageSections: Map<number, HomepageSection>;
  private featuresData: Map<number, Feature>;
  private pricingPlans: Map<number, PricingPlan>;
  private faqItems: Map<number, FaqItem>;
    
  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.teacherProfiles = new Map();
    this.sessions = new Map();
    this.reviews = new Map();
    this.exams = new Map();
    this.examAssignments = new Map();
    this.studentStats = new Map();
    
    // Initialize UI component maps
    this.testimonials = new Map();
    this.appSettingsData = new Map();
    this.homepageSections = new Map();
    this.featuresData = new Map();
    this.pricingPlans = new Map();
    this.faqItems = new Map();
    
    this.userIdCounter = 1;
    this.subjectIdCounter = 1;
    this.teacherProfileIdCounter = 1;
    this.sessionIdCounter = 1;
    this.reviewIdCounter = 1;
    this.examIdCounter = 1;
    this.examAssignmentIdCounter = 1;
    this.studentStatsIdCounter = 1;
    this.testimonialIdCounter = 1;
    this.appSettingsIdCounter = 1;
    this.homepageSectionIdCounter = 1;
    this.featureIdCounter = 1;
    this.pricingPlanIdCounter = 1;
    this.faqItemIdCounter = 1;
    
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

  // UI Content - Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values())
      .filter(testimonial => testimonial.visible)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }

  async createTestimonial(testimonialData: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialIdCounter++;
    const now = new Date();
    const testimonial: Testimonial = {
      ...testimonialData,
      id,
      date: now,
      visible: testimonialData.visible ?? true
    };
    this.testimonials.set(id, testimonial);
    return testimonial;
  }

  async updateTestimonial(id: number, testimonialData: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;

    const updatedTestimonial: Testimonial = {
      ...testimonial,
      ...testimonialData
    };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }

  // UI Content - App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    // Always return the first one if exists
    const allSettings = Array.from(this.appSettingsData.values());
    return allSettings.length > 0 ? allSettings[0] : undefined;
  }

  async updateAppSettings(settingsData: Partial<InsertAppSettings>): Promise<AppSettings> {
    // Check if settings exist
    const existingSettings = await this.getAppSettings();
    
    if (existingSettings) {
      // Update existing settings
      const updatedSettings: AppSettings = {
        ...existingSettings,
        ...settingsData
      };
      this.appSettingsData.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      // Create settings if not exist
      const id = this.appSettingsIdCounter++;
      const newSettings: AppSettings = {
        id,
        siteName: settingsData.siteName || "EduConnect",
        logoUrl: settingsData.logoUrl || "/logo.svg",
        primaryColor: settingsData.primaryColor || "#4f46e5",
        secondaryColor: settingsData.secondaryColor || "#f97316",
        contactEmail: settingsData.contactEmail || "info@educonnect.com",
        contactPhone: settingsData.contactPhone || "+1234567890",
        address: settingsData.address || "",
        socialLinks: settingsData.socialLinks || {},
        metaDescription: settingsData.metaDescription || "Online education platform connecting students with teachers",
        metaKeywords: settingsData.metaKeywords || "education, online learning, tutoring",
        googleAnalyticsId: settingsData.googleAnalyticsId || "",
        facebookPixelId: settingsData.facebookPixelId || "",
        customCss: settingsData.customCss || "",
        customJs: settingsData.customJs || ""
      };
      this.appSettingsData.set(id, newSettings);
      return newSettings;
    }
  }

  // UI Content - Homepage Sections
  async getHomepageSections(): Promise<HomepageSection[]> {
    return Array.from(this.homepageSections.values())
      .filter(section => section.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getHomepageSection(id: number): Promise<HomepageSection | undefined> {
    return this.homepageSections.get(id);
  }

  async createHomepageSection(sectionData: InsertHomepageSection): Promise<HomepageSection> {
    const id = this.homepageSectionIdCounter++;
    const section: HomepageSection = {
      ...sectionData,
      id,
      visible: sectionData.visible ?? true,
      order: sectionData.order ?? 0
    };
    this.homepageSections.set(id, section);
    return section;
  }

  async updateHomepageSection(id: number, sectionData: Partial<InsertHomepageSection>): Promise<HomepageSection | undefined> {
    const section = this.homepageSections.get(id);
    if (!section) return undefined;

    const updatedSection: HomepageSection = {
      ...section,
      ...sectionData
    };
    this.homepageSections.set(id, updatedSection);
    return updatedSection;
  }

  // UI Content - Features
  async getFeatures(): Promise<Feature[]> {
    return Array.from(this.featuresData.values())
      .filter(feature => feature.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getFeature(id: number): Promise<Feature | undefined> {
    return this.featuresData.get(id);
  }

  async createFeature(featureData: InsertFeature): Promise<Feature> {
    const id = this.featureIdCounter++;
    const feature: Feature = {
      ...featureData,
      id,
      visible: featureData.visible ?? true,
      order: featureData.order ?? 0
    };
    this.featuresData.set(id, feature);
    return feature;
  }

  async updateFeature(id: number, featureData: Partial<InsertFeature>): Promise<Feature | undefined> {
    const feature = this.featuresData.get(id);
    if (!feature) return undefined;

    const updatedFeature: Feature = {
      ...feature,
      ...featureData
    };
    this.featuresData.set(id, updatedFeature);
    return updatedFeature;
  }

  // UI Content - Pricing Plans
  async getPricingPlans(): Promise<PricingPlan[]> {
    return Array.from(this.pricingPlans.values())
      .filter(plan => plan.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getPricingPlan(id: number): Promise<PricingPlan | undefined> {
    return this.pricingPlans.get(id);
  }

  async createPricingPlan(planData: InsertPricingPlan): Promise<PricingPlan> {
    const id = this.pricingPlanIdCounter++;
    const plan: PricingPlan = {
      ...planData,
      id,
      active: planData.active ?? true,
      order: planData.order ?? 0,
      features: Array.isArray(planData.features) ? planData.features : []
    };
    this.pricingPlans.set(id, plan);
    return plan;
  }

  async updatePricingPlan(id: number, planData: Partial<InsertPricingPlan>): Promise<PricingPlan | undefined> {
    const plan = this.pricingPlans.get(id);
    if (!plan) return undefined;

    const updatedPlan: PricingPlan = {
      ...plan,
      ...planData,
      features: Array.isArray(planData.features) ? planData.features : plan.features
    };
    this.pricingPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  // UI Content - FAQ Items
  async getFaqItems(): Promise<FaqItem[]> {
    return Array.from(this.faqItems.values())
      .filter(item => item.visible)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getFaqItem(id: number): Promise<FaqItem | undefined> {
    return this.faqItems.get(id);
  }

  async createFaqItem(itemData: InsertFaqItem): Promise<FaqItem> {
    const id = this.faqItemIdCounter++;
    const item: FaqItem = {
      ...itemData,
      id,
      visible: itemData.visible ?? true,
      order: itemData.order ?? 0
    };
    this.faqItems.set(id, item);
    return item;
  }

  async updateFaqItem(id: number, itemData: Partial<InsertFaqItem>): Promise<FaqItem | undefined> {
    const item = this.faqItems.get(id);
    if (!item) return undefined;

    const updatedItem: FaqItem = {
      ...item,
      ...itemData
    };
    this.faqItems.set(id, updatedItem);
    return updatedItem;
  }
}

// Use DatabaseStorage for production
import { DatabaseStorage } from "./databaseStorage";
export const storage = new DatabaseStorage();
