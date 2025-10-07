import { RateLimiter } from '../src/middleware/rateLimiter';

export const config = {
  runtime: 'edge',
};

// Create a global rate limiter instance
const rateLimiter = new RateLimiter(60, 60_000);

// Parameter mapping for AnexTour API
const paramMap: Record<string, string> = {
  charter: "CHARTER",
  adults: "ADULT",
  ages: "AGES",
  checkin: "CHECKIN_BEG",
  checkout: "CHECKIN_END",
  children: "CHILD",
  costmax: "COSTMAX",
  costmin: "COSTMIN",
  currency: "CURRENCY",
  filter: "FILTER",
  freight: "FREIGHT",
  statefrom: "STATEFROM",
  partition_price: "PARTITION_PRICE",
  price_page: "PRICE_PAGE",
  reconpage: "RECONPAGE",
  regular: "REGULAR",
  search_mode: "SEARCH_MODE",
  search_type: "SEARCH_TYPE",
  sort_type: "SORT_TYPE",
  state: "STATE",
  the_best_at_top: "THE_BEST_AT_TOP",
  townfrom: "TOWNFROM",
  nightmin: "NIGHTMIN",
  nightmax: "NIGHTMAX"
};

const defaults: Record<string, string> = {
  CHARTER: "True",
  ADULT: "2",
  AGES: "",
  CHECKIN_BEG: "20251111",
  CHECKIN_END: "20251114",
  CHILD: "0",
  COSTMAX: "",
  COSTMIN: "",
  CURRENCY: "1",
  FILTER: "1",
  FREIGHT: "1",
  STATEFROM: "2",
  PARTITION_PRICE: "32",
  PRICE_PAGE: "1",
  RECONPAGE: "40",
  REGULAR: "True",
  SEARCH_MODE: "b2c",
  SEARCH_TYPE: "PACKET_ONLY_HOTELS",
  SORT_TYPE: "0",
  STATE: "176",
  THE_BEST_AT_TOP: "false",
  TOWNFROM: "1",
  NIGHTMIN: "7",
  NIGHTMAX: "7"
};

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

    // Parse URL and build query parameters
    const url = new URL(req.url);
    const params = new URLSearchParams(defaults);
    
    // Manual iteration over search parameters for Edge Runtime compatibility
    const searchParamsString = url.search.slice(1); // Remove the '?' prefix
    if (searchParamsString) {
      const pairs = searchParamsString.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          const decodedKey = decodeURIComponent(key);
          const decodedValue = decodeURIComponent(value);
          const mappedKey = paramMap[decodedKey.toLowerCase()] || decodedKey.toUpperCase();
          params.set(mappedKey, decodedValue);
        }
      }
    }

    const apiUrl = `https://api.anextour.ru/search?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        referer: "https://anextour.ru/"
      }
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      data,
      message: "Hotels fetched successfully",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Search error:', error);
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return new Response(JSON.stringify({
      error: "Failed to search hotels",
      details: { originalError: errorMessage },
      timestamp: new Date().toISOString()
    }), { status: 500, headers: corsHeaders });
  }
}