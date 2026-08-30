import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes blocage

export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Si la fenêtre de 15 min est dépassée et non bloqué, on réinitialise
  if (now - record.firstAttemptAt > WINDOW_MS && (!record.blockedUntil || now >= record.blockedUntil)) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): {
  blocked: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  let record = loginAttempts.get(ip);

  if (!record || (now - record.firstAttemptAt > WINDOW_MS && (!record.blockedUntil || now >= record.blockedUntil))) {
    record = { count: 1, firstAttemptAt: now };
    loginAttempts.set(ip, record);
    return { blocked: false };
  }

  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { blocked: true, retryAfterSeconds };
  }

  return { blocked: false };
}

export function recordSuccessfulLogin(ip: string): void {
  loginAttempts.delete(ip);
}
