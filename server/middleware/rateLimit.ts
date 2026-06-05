import rateLimit from "express-rate-limit";

// Strict limit for content-creating endpoints (submissions, reports).
// Keyed by IP. Generous enough for honest users, tight enough to blunt spam.
export const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 submissions/reports per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." },
});

// Looser limit for gameplay attempts (high-frequency, low-risk).
export const attemptLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Slow down a bit." },
});

// Tight limit for the (admin-only) LLM proxy and unlock attempts.
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
