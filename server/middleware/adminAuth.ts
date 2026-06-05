import type { Request, Response, NextFunction } from "express";
import "express-session";

// Augment the session with our app-specific fields.
declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    unlockedCollections?: number[];
    userId?: number;
  }
}

// Gate for /api/admin/* and other privileged routes.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAdmin) {
    return next();
  }
  return res.status(401).json({ message: "Admin authentication required" });
}

// Gate for routes that need a logged-in user account.
export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Please log in" });
}

// Validate a plaintext password against ADMIN_PASSWORD and flip the session flag.
export function adminLogin(req: Request, res: Response) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(500).json({ message: "Admin password not configured on server" });
  }
  const { password } = req.body || {};
  if (typeof password !== "string" || password !== expected) {
    return res.status(401).json({ message: "Incorrect password" });
  }
  req.session.isAdmin = true;
  return res.json({ ok: true });
}

export function adminLogout(req: Request, res: Response) {
  if (req.session) req.session.isAdmin = false;
  return res.json({ ok: true });
}
