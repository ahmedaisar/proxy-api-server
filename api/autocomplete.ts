import { RateLimiter } from '../src/middleware/rateLimiter';

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

    // Parse URL to get the query parameter
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const locale = url.searchParams.get('locale') || 'en';
    
    if (!query) {
      return new Response(JSON.stringify({
        error: "Missing 'query' parameter",
        timestamp: new Date().toISOString()
      }), { status: 400, headers: corsHeaders });
    }

    const apiUrl = `https://ostrovok.ru/api/site/multicomplete.json?query=${encodeURIComponent(query)}&locale=${encodeURIComponent(locale)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "accept": "application/json, text/plain, */*",
        "sec-ch-ua": "\"Google Chrome\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "referer": "https://ostrovok.ru/"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: "Failed to fetch data from Ostrovok API",
        details: { status: response.status, statusText: response.statusText },
        timestamp: new Date().toISOString()
      }), { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      data,
      message: "Autocomplete results fetched successfully",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Autocomplete error:', error);
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return new Response(JSON.stringify({
      error: "Failed to fetch autocomplete results",
      details: { originalError: errorMessage },
      timestamp: new Date().toISOString()
    }), { status: 500, headers: corsHeaders });
  }
}