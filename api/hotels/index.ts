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

export default async function handler(req: Request): Promise<Response> {
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

    // Parse URL and extract hotel slug
    const url = new URL(req.url);
    
    // Method 1: Check for slug in query parameter (more robust)
    let hotelSlug = url.searchParams.get('slug');
    
    // Method 2: If no query param, extract from path (fallback)
    if (!hotelSlug) {
      // Remove the leading '/api/hotels' part and get the remaining path
      const path = url.pathname.replace('/api/hotels', '');
      if (path && path.length > 1) {
        // If path exists and is not just '/', use it as the slug
        hotelSlug = path.startsWith('/') ? path : `/${path}`;
      }
    }

    // Method 3: Handle full slug format from your example: "/hotels/maldives/arrival-beachspa"
    if (hotelSlug && !hotelSlug.startsWith('/hotels/')) {
      // If it doesn't start with '/hotels/', assume it needs to be prefixed
      if (!hotelSlug.startsWith('/')) {
        hotelSlug = `/hotels/${hotelSlug}`;
      } else {
        hotelSlug = `/hotels${hotelSlug}`;
      }
    }

    // Validate slug
    if (!hotelSlug || hotelSlug === '/' || hotelSlug === '/hotels/' || hotelSlug.trim() === '') {
      return new Response(JSON.stringify({
        error: "Hotel slug is required. Provide it as query parameter: ?slug=/hotels/maldives/arrival-beachspa or as path: /api/hotels/maldives/arrival-beachspa",
        examples: [
          "GET /api/hotels?slug=/hotels/maldives/arrival-beachspa",
          "GET /api/hotels/maldives/arrival-beachspa"
        ],
        timestamp: new Date().toISOString()
      }), { status: 400, headers: corsHeaders });
    }

    // Clean and encode the hotel slug for the API request
    const cleanSlug = hotelSlug.trim();
    const encodedHotelSlug = encodeURIComponent(cleanSlug);
    const apiUrl = `https://api.anextour.ru/b2c/hotel?hotel=${encodedHotelSlug}`;

    console.log(`Fetching hotel details for slug: "${cleanSlug}" -> ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        "user-agent": "AnexTour-Proxy/1.0"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Failed to fetch hotel details: ${response.status} ${response.statusText}`,
        slug: cleanSlug,
        apiUrl: apiUrl.replace(encodedHotelSlug, '[ENCODED_SLUG]'), // Don't expose the full URL in error
        timestamp: new Date().toISOString()
      }), { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      data,
      message: "Hotel details fetched successfully",
      slug: cleanSlug,
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
      details: { originalError: errorMessage },
      timestamp: new Date().toISOString()
    }), { status: 500, headers: corsHeaders });
  }
}