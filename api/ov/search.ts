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

// Generate a random UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json',
  };

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Allow both GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: "Method not allowed. Use GET or POST.",
        examples: [
          "GET /api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2",
          "POST /api/ov/search with JSON body"
        ],
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

    // Parse parameters from URL query params (GET) or request body (POST)
    const url = new URL(req.url);
    let params: any = {};

    if (req.method === 'GET') {
      // Extract from URL parameters
      const regionIdParam = url.searchParams.get('region_id');
      const adultsParam = url.searchParams.get('adults');
      const pageParam = url.searchParams.get('page');
      const kindsParam = url.searchParams.get('kinds');
      const mapHotelsParam = url.searchParams.get('map_hotels');

      params = {
        arrival_date: url.searchParams.get('arrival_date'),
        departure_date: url.searchParams.get('departure_date'),
        region_id: regionIdParam ? parseInt(regionIdParam) : undefined,
        adults: adultsParam ? parseInt(adultsParam) : undefined,
        currency: url.searchParams.get('currency'),
        language: url.searchParams.get('language'),
        page: pageParam ? parseInt(pageParam) : undefined,
        kinds: kindsParam ? kindsParam.split(',') : undefined,
        sort: url.searchParams.get('sort'),
        map_hotels: mapHotelsParam ? mapHotelsParam === 'true' : undefined
      };
      
      // Remove null and undefined values
      params = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== null && v !== undefined)
      );
    } else {
      // Extract from POST body
      params = await req.json();
    }

    // Extract parameters with defaults
    const arrival_date = params.arrival_date || '2025-11-10';
    const departure_date = params.departure_date || '2025-11-15';
    const region_id = params.region_id || 109;
    const adults = params.adults || 2;
    const currency = params.currency || 'RUB';
    const language = params.language || 'en';
    const page = params.page || 1;
    const kinds = params.kinds || ['resort'];
    const sort = params.sort || 'price_asc';
    const map_hotels = params.map_hotels !== undefined ? params.map_hotels : true;

    // Generate UUIDs for session
    const sessionId = generateUUID();
    const searchUuid = generateUUID();

    // Build the payload for Ostrovok API
    const payload = {
      session_params: {
        arrival_date,
        currency,
        departure_date,
        language,
        paxes: [{ adults }],
        region_id,
        search_uuid: searchUuid
      },
      page,
      filters: { kinds },
      sort,
      session_id: sessionId,
      map_hotels
    };

    // Make request to Ostrovok API
    const ostrovokUrl = `https://ostrovok.ru/hotel/search/v2/site/serp?session=${sessionId}`;

    console.log(`Fetching Ostrovok hotels: region=${region_id}, dates=${arrival_date} to ${departure_date}`);

    const response = await fetch(ostrovokUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'pragma': 'no-cache',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'referer': `https://ostrovok.ru/hotel/maldives/?q=${region_id}&dates=${arrival_date}-${departure_date}&guests=${adults}&search=yes`,
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Ostrovok API error: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString()
      }), { status: response.status, headers: corsHeaders });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      data,
      metadata: {
        session_id: sessionId,
        search_uuid: searchUuid,
        search_params: {
          region_id,
          arrival_date,
          departure_date,
          adults,
          currency,
          page
        }
      },
      message: "Hotels fetched successfully from Ostrovok",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Ostrovok search error:', error);
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return new Response(JSON.stringify({
      error: "Failed to search Ostrovok hotels",
      details: { originalError: errorMessage },
      timestamp: new Date().toISOString()
    }), { status: 500, headers: corsHeaders });
  }
}