export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request): Promise<Response> {
  // Minimal CORS headers for speed
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    // Fast CORS preflight handling
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, // No content status is faster
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
        }
      });
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({
        error: "Method not allowed"
      }), { status: 405, headers: corsHeaders });
    }

    // Rate limiting removed to maximize performance

    // Parse URL to get the query parameter
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const locale = url.searchParams.get('locale') || 'en';
    
    if (!query) {
      return new Response(JSON.stringify({
        error: "Missing 'query' parameter"
      }), { status: 400, headers: corsHeaders });
    }

    const apiUrl = `https://ostrovok.ru/api/site/multicomplete.json?query=${encodeURIComponent(query)}&locale=${encodeURIComponent(locale)}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "referer": "https://ostrovok.ru/"
      }
    });

    if (!response.ok) {
      // Direct error pass-through for speed
      return new Response(JSON.stringify({
        error: "API error",
        status: response.status
      }), { status: response.status, headers: corsHeaders });
    }

    // Direct data pass-through without wrapping for speed
    const data = await response.json();
    
    // Return data directly without additional wrapping or timestamp for speed
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    // Simplified error handling for speed
    return new Response(JSON.stringify({ 
      error: "Error" 
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}