import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { pool } from "./db";


const app = express();
// Baseline security headers. CSP is left off for now (the Vite dev client and
// inline styles need a tailored policy); revisit when adding HTTPS/deploy.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Server-side sessions (admin auth + collection unlocks live here).
const PgSession = connectPgSimple(session);
app.set("trust proxy", 1);
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "dev-insecure-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  }),
);


app.use((req, res, next) => {
 const start = Date.now();
 const path = req.path;
 let capturedJsonResponse: Record<string, any> | undefined = undefined;


 const originalResJson = res.json;
 res.json = function (bodyJson, ...args) {
   capturedJsonResponse = bodyJson;
   return originalResJson.apply(res, [bodyJson, ...args]);
 };


 res.on("finish", () => {
   const duration = Date.now() - start;
   if (path.startsWith("/api")) {
     let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
     if (capturedJsonResponse) {
       logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
     }


     if (logLine.length > 80) {
       logLine = logLine.slice(0, 79) + "…";
     }


     log(logLine);
   }
 });


 next();
});


(async () => {
 // Seed starter data if empty, then run the one-time backfill (legacy fakes →
 // story_fakes, existing stories → approved). Both are idempotent/guarded.
 try {
   await storage.initializeTestData();
   await storage.backfillFakesAndStatus();
 } catch (err) {
   console.error("Startup data init/backfill failed:", err);
 }

 const server = await registerRoutes(app);


 app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
   const status = err.status || err.statusCode || 500;
   const message = err.message || "Internal Server Error";


   res.status(status).json({ message });
   throw err;
 });


 // importantly only setup vite in development and after
 // setting up all the other routes so the catch-all route
 // doesn't interfere with the other routes
 if (app.get("env") === "development") {
   await setupVite(app, server);
 } else {
   serveStatic(app);
 }


 // ALWAYS serve the app on port 5000
 // this serves both the API and the client.
 // It is the only port that is not firewalled.
 const port = 5000;
 server.listen({
   port,
   host: "0.0.0.0",
   reusePort: true,
 }, () => {
   log(`serving on port ${port}`);
 });
})();



