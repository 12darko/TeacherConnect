import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { User } from "@shared/schema";

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

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate user ID
    const id = generateUserId();

    // Create user
    const user = await storage.upsertUser({
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      authProvider: "local",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create initial student stats if student
    if (role === "student") {
      await storage.createStudentStats({ studentId: id });
    }

    // Set session
    req.session.userId = user.id;

    // Return user without sensitive data
    const { passwordHash: _, ...userData } = user;
    res.status(201).json({ user: userData });
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

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash || user.authProvider !== "local") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set session
    req.session.userId = user.id;

    // Return user without sensitive data
    const { passwordHash: _, ...userData } = user;
    res.json({ user: userData });
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
    const { passwordHash: _, ...userData } = req.user;
    res.json(userData);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Failed to get current user" });
  }
};