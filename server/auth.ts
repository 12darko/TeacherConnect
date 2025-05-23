import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { User } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend express-session
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Middleware to check if user has required role
 */
export const hasRole = (role: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roles = Array.isArray(role) ? role : [role];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }

    next();
  };
};

/**
 * Generate a random salt for password hashing
 */
export const generateSalt = async (): Promise<string> => {
  return await bcrypt.genSalt(10);
};

/**
 * Hash a password with bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await generateSalt();
  return await bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a unique user ID
 */
export const generateUserId = (): string => {
  return uuidv4();
};

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    console.log("Register attempt for email:", email);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate user ID
    const id = generateUserId();

    // JavaScript'te camelCase kullanıyoruz (drizzle dönüşüm yapacak)
    const userData = {
      id,
      email,
      passwordHash, // password_hash olarak değil, passwordHash olarak gönder
      firstName,    // first_name olarak değil, firstName olarak gönder
      lastName,     // last_name olarak değil, lastName olarak gönder
      role,
      authProvider: "local", // auth_provider olarak değil, authProvider olarak gönder
      createdAt: new Date(), // created_at olarak değil, createdAt olarak gönder
      updatedAt: new Date()  // updated_at olarak değil, updatedAt olarak gönder
    };

    console.log("Creating user with data:", { ...userData, password_hash: '**hidden**' });

    // Ayrıntılı log çıktısı ekliyorum, ne gönderiliyor ve ne dönüyor?
    console.log("Sending data to database:", {
      ...userData,
      password_hash: "**hidden**" // Gerçek değeri gizleyerek
    });
    const user = await storage.upsertUser(userData);
    console.log("Database returned user:", {
      ...user,
      passwordHash: user.passwordHash ? "**exists**" : "**missing**"
    });

    // Create initial student stats if student
    if (role === "student") {
      await storage.createStudentStats({ studentId: id });
    }

    // Set session safely
    if (req.session) {
      req.session.userId = user.id;
      await new Promise<void>((resolve) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }
          resolve();
        });
      });
    } else {
      console.error("Session object is undefined during registration");
    }

    // Return user without sensitive data
    const userDataToReturn = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || firstName,
      lastName: user.lastName || lastName,
      role: user.role,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl
    };

    console.log("Registration successful for user:", email);
    res.status(201).json({ user: userDataToReturn });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
};

/**
 * Login a user
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    // Find user
    const user = await storage.getUserByEmail(email);
    console.log("User found:", user ? "Yes" : "No");

    // Eğer kullanıcı bulunamadıysa
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Veri yapısını kontrol et - veritabanında snake_case, kodda camelCase
    // @ts-ignore - Tip kesin olarak bilinemiyor, runtime kontrol yapıyoruz
    const passwordHash = user.passwordHash || user.password_hash;
    // @ts-ignore
    const authProvider = user.authProvider || user.auth_provider;
    
    console.log("DEBUG - passwordHash exists:", !!passwordHash);
    console.log("DEBUG - authProvider:", authProvider);
    
    if (!passwordHash) {
      console.log("Invalid credentials: No password hash found");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (authProvider !== "local") {
      console.log(`Invalid credentials: Auth provider is ${authProvider}, not local`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Şifre kontrolü
    try {
      const isPasswordValid = await comparePassword(password, passwordHash);
      console.log("Password valid:", isPasswordValid ? "Yes" : "No");
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Password comparison error:", error);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Session'ı güvenli bir şekilde ayarla
    if (req.session) {
      req.session.userId = user.id;
      await new Promise<void>((resolve) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }
          resolve();
        });
      });
    } else {
      console.error("Session object is undefined during login");
    }

    // Hassas verileri çıkararak kullanıcıyı döndür
    const userDataToReturn = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName, 
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio
    };
    
    console.log("Login successful for user:", userDataToReturn.email);
    res.json({ user: userDataToReturn });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
};

/**
 * Logout a user
 */
export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.json({ message: "Logged out successfully" });
  });
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Return user without sensitive data
    const userDataToReturn = {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      profileImageUrl: req.user.profileImageUrl,
      bio: req.user.bio
    };
    res.json(userDataToReturn);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get current user" });
  }
};