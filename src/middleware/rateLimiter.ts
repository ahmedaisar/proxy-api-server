import type { RateLimitData } from "../types";

export class RateLimiter {
  private ipStore: Record<string, RateLimitData> = {};
  private rateLimit: number;
  private windowMs: number;

  constructor(rateLimit: number = 60, windowMs: number = 60_000) {
    this.rateLimit = rateLimit;
    this.windowMs = windowMs;
  }

  check(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();

    if (!this.ipStore[ip]) {
      this.ipStore[ip] = { count: 1, startTime: now };
      return { allowed: true, remaining: this.rateLimit - 1 };
    }

    const elapsed = now - this.ipStore[ip].startTime;
    
    if (elapsed < this.windowMs) {
      this.ipStore[ip].count++;
    } else {
      // Reset window
      this.ipStore[ip].count = 1;
      this.ipStore[ip].startTime = now;
    }

    const remaining = Math.max(0, this.rateLimit - this.ipStore[ip].count);
    const allowed = this.ipStore[ip].count <= this.rateLimit;

    return { allowed, remaining };
  }

  reset(ip: string): void {
    delete this.ipStore[ip];
  }

  cleanup(): void {
    const now = Date.now();
    for (const [ip, data] of Object.entries(this.ipStore)) {
      if (now - data.startTime > this.windowMs) {
        delete this.ipStore[ip];
      }
    }
  }
}