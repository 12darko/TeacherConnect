import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const authSessions = pgTable(
  "auth_sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User model (base for students, teachers, and admins)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: text("role").notNull().default("student"), // "student", "teacher", or "admin"
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider"), // "local", "google", "facebook", "apple", etc
  authProviderId: varchar("auth_provider_id"), // ID from the auth provider if using social login
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects that can be taught
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
});

// Class session recordings and materials
export const sessionRecordings = pgTable("session_recordings", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  recordingUrl: text("recording_url").notNull(),
  duration: integer("duration").notNull(), // in seconds
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Session notes - for teacher and student notes during sessions
export const sessionNotes = pgTable("session_notes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isPrivate: boolean("is_private").default(false),
});

// Session whiteboard snapshots
export const whiteboardSnapshots = pgTable("whiteboard_snapshots", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  name: varchar("name").default("Whiteboard Snapshot"),
});

// Shared files during sessions
export const sessionFiles = pgTable("session_files", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: varchar("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  description: text("description"),
});

// Teacher profiles with additional information
export const teacherProfiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectIds: json("subject_ids").$type<number[]>().notNull(),
  hourlyRate: doublePrecision("hourly_rate").notNull(),
  yearsOfExperience: integer("years_of_experience").notNull(),
  availability: json("availability").$type<{
    day: string;
    startTime: string;
    endTime: string;
  }[]>(),
  averageRating: doublePrecision("average_rating").default(0),
  totalReviews: integer("total_reviews").default(0),
  totalStudents: integer("total_students").default(0),
});

// Scheduled sessions between teachers and students
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull(), // "scheduled", "completed", "cancelled"
  sessionUrl: text("session_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Ders doğrulama alanları
  actualDuration: integer("actual_duration"), // Dersin gerçek süresi (dakika)
  studentConfirmed: boolean("student_confirmed").default(false), // Öğrenci dersin gerçekleştiğini onayladı mı?
  activityCount: integer("activity_count").default(0), // Ders sırasındaki aktivite sayısı (mesaj, dosya, vb.)
  isVerified: boolean("is_verified").default(false), // Ders ödemesi için onaylandı mı?
  verificationNotes: text("verification_notes"), // Doğrulama ile ilgili notlar
});

// Reviews left by students for teachers
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exams created by teachers
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  title: text("title").notNull(),
  description: text("description"),
  questions: json("questions").$type<{
    id: number;
    question: string;
    options?: string[];
    correctAnswer: string | number;
    type: 'multiple-choice' | 'text';
    points: number;
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exam assignments to students
export const examAssignments = pgTable("exam_assignments", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  score: integer("score"),
  answers: json("answers").$type<{
    questionId: number;
    answer: string | number;
  }[]>(),
  submittedAt: timestamp("submitted_at"),
});

// Student statistics
export const studentStats = pgTable("student_stats", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").notNull().references(() => users.id),
  totalSessionsAttended: integer("total_sessions_attended").default(0),
  totalExamsCompleted: integer("total_exams_completed").default(0),
  averageExamScore: doublePrecision("average_exam_score").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
});

// UI Content - Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  avatar_url: varchar("avatar_url"),
  comment: text("comment").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  date: timestamp("date").defaultNow(),
  visible: boolean("visible").default(true),
  role: varchar("role"),
});

// UI Content - App Settings
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  siteName: varchar("site_name").notNull().default("EduConnect"),
  logoUrl: varchar("logo_url"),
  primaryColor: varchar("primary_color").default("#0284c7"),
  secondaryColor: varchar("secondary_color").default("#f59e0b"),
  heroTitle: text("hero_title").default("Find the Perfect Teacher for Your Learning Journey"),
  heroSubtitle: text("hero_subtitle").default("Connect with expert teachers for personalized online lessons, assignments, and exams tailored to your learning goals."),
  footerText: text("footer_text").default("© 2024 EduConnect. All rights reserved."),
  contactEmail: varchar("contact_email").default("info@educonnect.com"),
  phone: varchar("phone"),
  address: text("address"),
  metaDescription: text("meta_description").default("EduConnect - Personalized Online Education and Teacher Matching Platform"),
  metaKeywords: text("meta_keywords").default("online education, teacher, course, exams, private lessons"),
});

// UI Content - Homepage Sections
export const homepageSections = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  sectionType: varchar("section_type").notNull(), // hero, features, testimonials, pricing, etc.
  title: varchar("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content"),
  imageUrl: varchar("image_url"),
  buttonText: varchar("button_text"),
  buttonUrl: varchar("button_url"),
  order: integer("order").notNull(),
  visible: boolean("visible").default(true),
});

// UI Content - Feature Items
export const features = pgTable("features", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(),
  order_position: integer("order_position").notNull().default(0),
  visible: boolean("visible").default(true),
});

// UI Content - How It Works Steps
export const howItWorksSteps = pgTable("how_it_works_steps", {
  id: serial("id").primaryKey(),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon"),
  visible: boolean("visible").default(true),
});

// UI Content - Statistics
export const siteStatistics = pgTable("site_statistics", {
  id: serial("id").primaryKey(),
  totalStudents: integer("total_students").default(0),
  totalTeachers: integer("total_teachers").default(0),
  totalSubjects: integer("total_subjects").default(0),
  totalSessions: integer("total_sessions").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// UI Content - Pricing Plans
export const pricingPlans = pgTable("pricing_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  price: doublePrecision("price").notNull(),
  currency: varchar("currency").default("TRY"),
  interval: varchar("interval").default("month"), // month, year, etc.
  description: text("description"),
  features: json("features").$type<string[]>().notNull(),
  recommended: boolean("recommended").default(false),
  active: boolean("active").default(true),
  order: integer("order").default(0),
});

// UI Content - FAQ Items
export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").default("general"),
  order: integer("order").default(0),
  visible: boolean("visible").default(true),
});

// UI Content - Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  parentId: integer("parent_id"),
  menuLocation: varchar("menu_location", { length: 50 }).notNull().default("main"),
  order_position: integer("order_position").notNull().default(0),
  visible: boolean("visible").default(true),
});

// Schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({ id: true, averageRating: true, totalReviews: true, totalStudents: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true });
export const insertExamAssignmentSchema = createInsertSchema(examAssignments).omit({ id: true, assignedAt: true, completed: true, score: true, submittedAt: true });
export const insertStudentStatsSchema = createInsertSchema(studentStats).omit({ id: true, totalSessionsAttended: true, totalExamsCompleted: true, averageExamScore: true, lastActivity: true });

// UI content insert schemas
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, date: true });
export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({ id: true });
export const insertHomepageSectionSchema = createInsertSchema(homepageSections).omit({ id: true });
export const insertFeatureSchema = createInsertSchema(features).omit({ id: true });
export const insertPricingPlanSchema = createInsertSchema(pricingPlans).omit({ id: true });
export const insertFaqItemSchema = createInsertSchema(faqItems).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });

// Types for insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertExamAssignment = z.infer<typeof insertExamAssignmentSchema>;
export type InsertStudentStats = z.infer<typeof insertStudentStatsSchema>;

// UI content insertion types
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type InsertHomepageSection = z.infer<typeof insertHomepageSectionSchema>;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

// Types for selection
export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamAssignment = typeof examAssignments.$inferSelect;
export type StudentStat = typeof studentStats.$inferSelect;

// UI content selection types
export type Testimonial = typeof testimonials.$inferSelect;
export type AppSettings = typeof appSettings.$inferSelect;
export type HomepageSection = typeof homepageSections.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type FaqItem = typeof faqItems.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;

// Session content types
export type SessionNote = typeof sessionNotes.$inferSelect;
export type SessionFile = typeof sessionFiles.$inferSelect;
export type WhiteboardSnapshot = typeof whiteboardSnapshots.$inferSelect;
export type SessionRecording = typeof sessionRecordings.$inferSelect;

// Insert schemas for session content
export const insertSessionNoteSchema = createInsertSchema(sessionNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionFileSchema = createInsertSchema(sessionFiles).omit({ id: true, uploadedAt: true });
export const insertWhiteboardSnapshotSchema = createInsertSchema(whiteboardSnapshots).omit({ id: true, createdAt: true });
export const insertSessionRecordingSchema = createInsertSchema(sessionRecordings).omit({ id: true, createdAt: true });

// Insert types for session content
export type InsertSessionNote = z.infer<typeof insertSessionNoteSchema>;
export type InsertSessionFile = z.infer<typeof insertSessionFileSchema>;
export type InsertWhiteboardSnapshot = z.infer<typeof insertWhiteboardSnapshotSchema>;
export type InsertSessionRecording = z.infer<typeof insertSessionRecordingSchema>;

// Extended schemas for validation
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["student", "teacher"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const teacherProfileSchema = insertTeacherProfileSchema.extend({
  subjectIds: z.array(z.number()).min(1, "Select at least one subject"),
  hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
  yearsOfExperience: z.number().min(0, "Years of experience must be a positive number"),
});

export const reviewSchema = insertReviewSchema.extend({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
});

// About Us page
export const aboutUs = pgTable("about_us", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mission: text("mission"),
  vision: text("vision"),
  values: text("values"),
  teamSectionTitle: varchar("team_section_title", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members for About page
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  bio: text("bio"),
  imageUrl: varchar("image_url", { length: 255 }),
  orderPosition: integer("order_position").default(0),
  visible: boolean("visible").default(true),
});

// Privacy Policy page
export const privacyPolicy = pgTable("privacy_policy", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Terms of Service page
export const termsOfService = pgTable("terms_of_service", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact page
export const contactPage = pgTable("contact_page", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  address: text("address"),
  mapEmbedUrl: text("map_embed_url"),
  formTitle: varchar("form_title", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});