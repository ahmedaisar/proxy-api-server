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
          "GET /api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17",
          "POST /api/ov/hotel with JSON body"
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
      const childrenParam = url.searchParams.get('children');
      const childAgesParam = url.searchParams.get('child_ages');

      // Build paxes object
      let paxes = undefined;
      if (adultsParam) {
        const adults = parseInt(adultsParam) || 2;
        const children = childrenParam ? parseInt(childrenParam) : 0;
        const child_ages = childAgesParam ? childAgesParam.split(',').map((age: string) => parseInt(age.trim())) : [];
        
        const paxObject: any = { adults };
        if (children > 0 && child_ages.length > 0) {
          paxObject.child_ages = child_ages.slice(0, children);
        }
        paxes = [paxObject];
      }

      params = {
        hotel: url.searchParams.get('hotel'),
        arrival_date: url.searchParams.get('arrival_date'),
        departure_date: url.searchParams.get('departure_date'),
        region_id: regionIdParam ? parseInt(regionIdParam) : undefined,
        currency: url.searchParams.get('currency'),
        lang: url.searchParams.get('lang'),
        paxes: paxes
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
    const hotel = params.hotel;
    const arrival_date = params.arrival_date || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })();
    const departure_date = params.departure_date || (() => {
      const nextWeek = new Date(arrival_date);
      nextWeek.setDate(nextWeek.getDate() + 5);
      return nextWeek.toISOString().split('T')[0];
    })();
    const region_id = params.region_id || 109;
    const currency = params.currency || 'USD';
    const lang = params.lang || 'en';
    const paxes = params.paxes || [{ adults: 2 }];
    const search_uuid = params.search_uuid || generateUUID();

    // Validate required parameters
    if (!hotel) {
      return new Response(JSON.stringify({
        error: "Missing required parameter: hotel",
        examples: [
          "GET /api/ov/hotel?hotel=reethi_faru_resort",
          "POST /api/ov/hotel with {\"hotel\": \"reethi_faru_resort\"}"
        ],
        timestamp: new Date().toISOString()
      }), { status: 400, headers: corsHeaders });
    }

    // Build the payload for Ostrovok API
    const payload = {
      arrival_date,
      departure_date,
      hotel,
      currency,
      lang,
      region_id,
      paxes,
      search_uuid
    };

    console.log(`Fetching Ostrovok hotel details: hotel=${hotel}, dates=${arrival_date} to ${departure_date}`);

    // Make request to Ostrovok.ru
    const response = await fetch('https://ostrovok.ru/hotel/search/v1/site/hp/search', {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'referer': `https://ostrovok.ru/hotel/maldives/meedhoo_(raa_atoll)/mid8755291/${hotel}/?dates=${arrival_date.replace(/-/g, '.')}-${departure_date.replace(/-/g, '.')}&guests=${paxes[0].adults}`
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
        session_id: generateUUID(),
        search_uuid: search_uuid,
        search_params: {
          hotel,
          arrival_date,
          departure_date,
          region_id,
          currency,
          lang,
          paxes
        }
      },
      message: "Hotel details fetched successfully from Ostrovok",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Ostrovok hotel details error:', error);
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return new Response(JSON.stringify({
      error: "Failed to fetch hotel details from Ostrovok",
      details: { originalError: errorMessage },
      timestamp: new Date().toISOString()
    }), { status: 500, headers: corsHeaders });
  }
}
   