import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RateLimiter } from '../src/middleware/rateLimiter';
import { ApiUtils } from '../src/utils/api';

// Create a global rate limiter instance
const rateLimiter = new RateLimiter(60, 60_000);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Rate limiting
    const ip = ApiUtils.getClientIp(req as any);
    const rateLimitResult = rateLimiter.check(ip);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded. Try again later.",
        details: { remaining: rateLimitResult.remaining, resetTime: "60 seconds" },
        timestamp: new Date().toISOString()
      });
    }

    // Health check response
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: "vercel"
    };

    return res.status(200).json({
      success: true,
      data: healthData,
      message: "API is healthy"
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
}