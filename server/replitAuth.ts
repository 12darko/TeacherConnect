import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";
import { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      dbUser?: User;
    }
  }
}

if (!process.env.REPLIT_DOMAINS) {
  console.warn("Environment variable REPLIT_DOMAINS not provided, hybrid auth system will only use local auth");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conObject: pool,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "session_store",
  });
  return session({
    secret: process.env.SESSION_SECRET || 'edu-connect-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  return await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    authProvider: "replit",
    authProviderId: claims["sub"],
    role: "student", // Default role for new registrations
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (process.env.REPLIT_DOMAINS) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      const dbUser = await upsertUser(tokens.claims());
      // @ts-ignore - we're adding dbUser to req
      user.dbUser = dbUser;
      verified(null, user);
    };

    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  }
}

// Middleware to check if user is authenticated using either local or Replit Auth
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // First check for Replit Auth
  if (req.isAuthenticated() && req.user) {
    // If using Replit Auth, check token expiration
    const user = req.user as any;
    if (user.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      
      if (now <= user.expires_at) {
        // Valid token, proceed
        return next();
      }

      const refreshToken = user.refresh_token;
      if (!refreshToken) {
        return res.redirect("/api/login");
      }

      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        return next();
      } catch (error) {
        return res.redirect("/api/login");
      }
    }
    
    // Valid session via Replit Auth
    return next();
  }
  
  // Then check for local session auth
  if (req.session && req.session.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error("Error fetching user from session:", error);
    }
  }
  
  // No valid authentication
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check for specific role
export const hasRole = (role: string): RequestHandler => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get the user from database for role check
    let dbUser: User | undefined;
    
    if ((req.user as any).claims?.sub) {
      // Replit Auth
      dbUser = await storage.getUser((req.user as any).claims.sub);
    } else {
      // Local Auth
      dbUser = req.user as User;
    }
    
    if (!dbUser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (dbUser.role !== role && (Array.isArray(role) && !role.includes(dbUser.role))) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    return next();
  };
};