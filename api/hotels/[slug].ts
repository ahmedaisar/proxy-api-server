import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RateLimiter } from '../../src/middleware/rateLimiter';
import { ApiUtils } from '../../src/utils/api';
import { getHotelById } from '../../src/handlers/hotels';

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

    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: "Method not allowed",
        timestamp: new Date().toISOString()
      });
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

    // Extract hotel slug from query parameters
    const { slug } = req.query;
    
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        error: "Hotel slug is required",
        timestamp: new Date().toISOString()
      });
    }

    // Create a mock request object that matches our ApiRequest interface
    const mockRequest = {
      url: req.url || '',
      method: req.method,
      headers: new Headers(req.headers as any),
      params: { id: slug },
      query: new URLSearchParams()
    };

    // Call the get hotel by ID function
    const response = await getHotelById(mockRequest as any);
    const responseData = await response.json();

    return res.status(response.status).json(responseData);

  } catch (error) {
    console.error('Hotel fetch error:', error);
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return res.status(500).json({
      error: "Failed to fetch hotel details",
      details: { originalError: errorMessage },
      timestamp: new Date().toISOString()
    });
  }
}