import rateLimit from "express-rate-limit";

// The complaint submit limiter is bypassed in local development so repeated
// automated test runs (vitest integration suites, Playwright e2e flows) from
// localhost don't hit the 5/hour cap and fail with false-negative 429s.
// Production behavior is unchanged: the dev workflow sets NODE_ENV=development
// explicitly, while deployments run with NODE_ENV=production (or unset), so
// the skip never applies outside local dev.
const isDevelopment = () => process.env.NODE_ENV === "development";

export const complaintSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevelopment,
  message: {
    error:
      "Too many complaints submitted from this address. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDevelopment,
  message: {
    error: "Too many sign-in attempts. Please try again later.",
  },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please try again later." },
});
