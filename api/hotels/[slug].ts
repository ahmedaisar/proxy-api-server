import { RateLimiter } from '../../src/middleware/rateLimiter';

export const config = {
  runtime: 'edge',
};

// Create a global rate limiter instance
const rateLimiter = new RateLimiter(60, 60_000);

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export default async function handler(req: Request, { params }: { params: { slug: string } }): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json',
  };

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({
        error: "Method not allowed",
        timestamp: new Date().toISOString()
      }), { status: 405, headers: corsHeaders });
    }

    // Rate limiting
    const ip = getClientIp(req);
    const rateLimitResult = rateLimiter.check(ip);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Try again later.",
        details: { remaining: rateLimitResult.remaining, resetTime: "60 seconds" },
        timestamp: new Date().toISOString()
      }), { status: 429, headers: corsHeaders });
    }

    // Extract hotel slug from params
    const slug = params?.slug;
    
    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({
        error: "Hotel slug is required",
        timestamp: new Date().toISOString()
      }), { status: 400, headers: corsHeaders });
    }

    // URL encode the hotel slug for the API request
    const encodedHotelSlug = encodeURIComponent(slug);
    const apiUrl = `https://api.anextour.ru/b2c/hotel?hotel=${encodedHotelSlug}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Failed to fetch hotel details: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString()
      }), { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      data,
      message: "Hotel details fetched successfully",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Hotel fetch error:', error);
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return new Response(JSON.stringify({
      error: "Failed to fetch hotel details",
      details: { originalError: errorMessage, slug: params?.slug },
      timestamp: new Date().toISOString()
    }), { status: 500, headers: corsHeaders });
  }
}