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

interface EnhancedScrapedHotelData {
  name?: string;
  rating?: number;
  review_count?: number;
  review_scores?: {
    cleanliness?: number;
    location?: number;
    service?: number;
    meals?: number;
    value?: number;
    room?: number;
    wifi?: number;
  };
  price?: string;
  location?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
  detailed_description?: {
    location_info?: string;
    resort_facilities?: string;
    room_amenities?: string;
    full_description?: string;
  };
  additional_info?: {
    transfer_details?: string;
    policies?: string[];
    pricing_info?: string;
    full_additional_info?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rooms?: {
    type?: string;
    price?: string;
    description?: string;
    amenities?: string[];
    images?: string[];
    bed_type?: string;
    size?: string;
    cancellation_policy?: string;
  }[];
  room_galleries?: {
    room_type?: string;
    images?: string[];
    thumbnails?: string[];
  }[];
  hotel_facts?: {
    rooms?: number;
    checkin?: string;
    checkout?: string;
    electrical_sockets?: string[];
    children_policy?: string[];
  };
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
          "GET /api/ov/scraper?master_id=6669997&ota_hotel_id=canareef_resort_maldives&region_slug=maldives/addu_atoll",
          "POST /api/ov/scraper with JSON body"
        ],
        timestamp: new Date().toISOString()
      }), { status: 405, headers: corsHeaders });
    }

    // Apply rate limiting
    const clientIp = getClientIp(req);
    const rateLimitCheck = rateLimiter.check(clientIp);
    
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please try again later.",
        rateLimitRemaining: rateLimitCheck.remaining,
        timestamp: new Date().toISOString()
      }), { status: 429, headers: corsHeaders });
    }

    let hotelUrl: string;
    let masterId: string;
    let otaHotelId: string;
    let regionSlug: string;

    // Parse parameters based on request method
    if (req.method === 'GET') {
      const url = new URL(req.url);
      
      // Option 1: Direct URL parameter
      const directUrl = url.searchParams.get('url');
      if (directUrl) {
        hotelUrl = directUrl;
        // Extract master_id from URL for logging
        const midMatch = directUrl.match(/mid(\d+)/);
        masterId = midMatch?.[1] || 'unknown';
        otaHotelId = 'from-url';
        regionSlug = 'from-url';
      } else {
        // Option 2: Individual parameters
        masterId = url.searchParams.get('master_id') || '';
        otaHotelId = url.searchParams.get('ota_hotel_id') || '';
        regionSlug = url.searchParams.get('region_slug') || '';
        
        if (masterId && otaHotelId && regionSlug) {
          hotelUrl = `https://ostrovok.ru/hotel/${regionSlug}/mid${masterId}/${otaHotelId}/`;
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters for GET request',
            message: 'Provide either "url" parameter OR all of: master_id, ota_hotel_id, region_slug',
            examples: [
              { 
                method: 'GET',
                option_1: '/api/ov/scraper?url=https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/',
                option_2: '/api/ov/scraper?master_id=6669997&ota_hotel_id=canareef_resort_maldives&region_slug=maldives/addu_atoll'
              }
            ]
          }), { status: 400, headers: corsHeaders });
        }
      }
    } else {
      // POST request handling (similar to existing scrape.ts)
      const body = await req.json();
      
      if (body.url) {
        hotelUrl = body.url;
        const midMatch = hotelUrl.match(/mid(\d+)/);
        masterId = midMatch?.[1] || 'unknown';
        otaHotelId = 'from-url';
        regionSlug = 'from-url';
      } else if (body.hotel) {
        const hotel = body.hotel;
        masterId = hotel.master_id?.toString() || '';
        otaHotelId = hotel.ota_hotel_id || '';
        regionSlug = hotel.static_vm?.region_catalog_slug || '';
        
        if (masterId && otaHotelId && regionSlug) {
          hotelUrl = `https://ostrovok.ru/hotel/${regionSlug}/mid${masterId}/${otaHotelId}/`;
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Incomplete hotel object',
            message: 'Hotel object must contain: master_id, ota_hotel_id, and static_vm.region_catalog_slug'
          }), { status: 400, headers: corsHeaders });
        }
      } else {
        masterId = body.master_id?.toString() || '';
        otaHotelId = body.ota_hotel_id || '';
        regionSlug = body.region_slug || '';
        
        if (masterId && otaHotelId && regionSlug) {
          hotelUrl = `https://ostrovok.ru/hotel/${regionSlug}/mid${masterId}/${otaHotelId}/`;
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters in POST body',
            message: 'Provide either "url", "hotel" object, OR individual parameters: master_id, ota_hotel_id, region_slug'
          }), { status: 400, headers: corsHeaders });
        }
      }
    }

    console.log(`🔍 Enhanced Scraping hotel data:`);
    console.log(`   Master ID: ${masterId}`);
    console.log(`   OTA Hotel ID: ${otaHotelId}`);
    console.log(`   Region Slug: ${regionSlug}`);
    console.log(`🌐 Fetching: ${hotelUrl}`);

    // Fetch the hotel page with enhanced headers
    const response = await fetch(hotelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hotel page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ Fetched HTML content (${html.length} chars)`);

    // Parse HTML and extract enhanced structured data
    const scrapedData = await extractEnhancedHotelData(html, masterId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        master_id: masterId,
        ota_hotel_id: otaHotelId,
        region_slug: regionSlug,
        source_url: hotelUrl,
        scraped_at: new Date().toISOString(),
        hotel: scrapedData,
        scraper_version: "enhanced_v1.0"
      },
      message: 'Enhanced hotel data scraped successfully'
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Enhanced Scraping error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown enhanced scraping error',
      message: 'Failed to scrape enhanced hotel data'
    }), { status: 500, headers: corsHeaders });
  }
}

// Enhanced HTML parsing function using manual DOM-like parsing
async function extractEnhancedHotelData(html: string, masterId: string): Promise<EnhancedScrapedHotelData> {
  const data: EnhancedScrapedHotelData = {};

  try {
    // Parse using manual string parsing (since we can't use Cheerio in Edge Runtime)
    const $ = createSimpleDOMParser(html);

    // Extract hotel name
    const nameElement = $.querySelector('h1') || $.querySelector('title');
    if (nameElement && nameElement.textContent) {
      const name = nameElement.textContent.trim();
      data.name = name.replace(/\s*[-|]\s*(?:Ostrovok|in\s).*$/i, '').trim();
    }

    // Extract rating with enhanced patterns
    const ratingElement = $.querySelector('.TotalRating_content__k5u6S');
    if (ratingElement && ratingElement.textContent) {
      const ratingText = ratingElement.textContent.replace(',', '.');
      data.rating = parseFloat(ratingText);
    }

    // Extract price information
    const priceElement = $.querySelector('[class*="price"]') || $.querySelector('[class*="Price"]');
    if (priceElement && priceElement.textContent) {
      const priceText = priceElement.textContent.match(/[₽$]\s*[\d,]+/);
      if (priceText) {
        data.price = priceText[0];
      }
    }

    // Extract images with better filtering
    const images: string[] = [];
    const imageElements = $.querySelectorAll('img[src*="cdn.worldota.net"]');
    
    for (const img of imageElements) {
      const src = img.getAttribute('src');
      if (src && 
          !src.includes('data:') && 
          !src.includes('.js') && 
          src.match(/\.(jpg|jpeg|png|webp)/) &&
          !images.includes(src)) {
        images.push(src);
      }
    }
    
    if (images.length > 0) {
      data.images = images.slice(0, 15);
    }

    // Extract enhanced room information with potential room galleries
    const rooms: any[] = [];
    const roomGalleries: any[] = [];

    // Look for room sections that might trigger popups
    const roomSections = $.querySelectorAll('[class*="Room"], [class*="room"], [data-room], button[class*="room"]');
    
    for (const roomSection of roomSections) {
      const roomData: any = {};
      
      // Extract room type from various possible locations
      const roomTypeElement = roomSection.querySelector('[class*="title"], [class*="name"], h2, h3, h4') || roomSection;
      if (roomTypeElement) {
        const roomType = roomTypeElement.textContent.trim();
        if (roomType && roomType.length > 3 && roomType.length < 100) {
          roomData.type = roomType;
        }
      }

      // Extract room price
      const roomPriceElement = roomSection.querySelector('[class*="price"], [class*="Price"]');
      if (roomPriceElement) {
        const priceMatch = roomPriceElement.textContent.match(/[₽$]\s*[\d,]+/);
        if (priceMatch) {
          roomData.price = priceMatch[0];
        }
      }

      // Extract room amenities
      const amenityElements = roomSection.querySelectorAll('[class*="amenity"], [class*="feature"]');
      const roomAmenities: string[] = [];
      
      for (const amenity of amenityElements) {
        const amenityText = amenity.textContent.trim();
        if (amenityText && amenityText.length > 2 && amenityText.length < 50) {
          roomAmenities.push(amenityText);
        }
      }
      
      if (roomAmenities.length > 0) {
        roomData.amenities = roomAmenities;
      }

      // Extract bed type information
      const bedElement = roomSection.querySelector('[class*="bed"], [class*="Bed"]');
      if (bedElement) {
        roomData.bed_type = bedElement.textContent.trim();
      }

      // Extract room size
      const sizeElement = roomSection.querySelector('[class*="size"], [class*="m²"], [class*="sqm"]');
      if (sizeElement) {
        const sizeMatch = sizeElement.textContent.match(/\d+\s*m²/);
        if (sizeMatch) {
          roomData.size = sizeMatch[0];
        }
      }

      if (Object.keys(roomData).length > 0) {
        rooms.push(roomData);
      }
    }

    if (rooms.length > 0) {
      data.rooms = rooms;
    }

    // Extract potential room gallery data from embedded JavaScript or data attributes
    const scriptElements = $.querySelectorAll('script');
    
    for (const script of scriptElements) {
      const scriptContent = script.textContent;
      
      // Look for room gallery data in JavaScript
      const roomGalleryMatch = scriptContent.match(/room.*gallery.*images/gi);
      if (roomGalleryMatch) {
        // Try to extract image URLs from the script
        const imageUrls = scriptContent.match(/https:\/\/cdn\.worldota\.net\/[^"']+\.(jpg|jpeg|png|webp)/gi);
        if (imageUrls && imageUrls.length > 0) {
          roomGalleries.push({
            room_type: "Detected from JS",
            images: imageUrls.slice(0, 10),
            thumbnails: imageUrls.slice(0, 5)
          });
        }
      }
    }

    // Extract room galleries from potential popup structures in HTML
    const popupElements = $.querySelectorAll('[class*="popup"], [class*="Popup"], [class*="modal"], [class*="Modal"]');
    
    for (const popup of popupElements) {
      const titleElement = popup.querySelector('[class*="title"], h1, h2, h3, h4');
      const imageElements = popup.querySelectorAll('img[src*="cdn.worldota.net"]');
      
      if (titleElement && imageElements.length > 0) {
        const roomType = titleElement.textContent.trim();
        const images: string[] = [];
        const thumbnails: string[] = [];
        
        for (const img of imageElements) {
          const src = img.getAttribute('src');
          if (src && src.match(/\.(jpg|jpeg|png|webp)/)) {
            images.push(src);
            
            // Create thumbnail URL (Ostrovok pattern)
            const thumbnailUrl = src.replace(/\/\d+x\d+\//, '/240x240/');
            if (!thumbnails.includes(thumbnailUrl)) {
              thumbnails.push(thumbnailUrl);
            }
          }
        }
        
        if (images.length > 0) {
          roomGalleries.push({
            room_type: roomType,
            images: images.slice(0, 15),
            thumbnails: thumbnails.slice(0, 8)
          });
        }
      }
    }

    if (roomGalleries.length > 0) {
      data.room_galleries = roomGalleries;
    }

    // Extract all other data using similar enhanced patterns
    // (amenities, reviews, policies, etc. - using the same logic as original but with better parsing)
    
    // Extract amenities
    const amenities: string[] = [];
    const amenityElements = $.querySelectorAll('[class*="amenity"], [class*="Amenity"], [class*="feature"]');
    
    for (const amenity of amenityElements) {
      const amenityText = amenity.textContent.trim();
      if (amenityText && amenityText.length > 2 && amenityText.length < 50 && 
          !amenityText.includes('ref=') && !amenities.includes(amenityText)) {
        amenities.push(amenityText);
      }
    }
    
    if (amenities.length > 0) {
      data.amenities = amenities.slice(0, 25);
    }

    // Extract review count
    const reviewElements = $.querySelectorAll('[class*="review"], [class*="Review"]');
    for (const review of reviewElements) {
      const reviewMatch = review.textContent.match(/(\d+)\s+reviews/i);
      if (reviewMatch) {
        data.review_count = parseInt(reviewMatch[1]);
        break;
      }
    }

    console.log(`✅ Enhanced extraction completed: name=${data.name}, rating=${data.rating}, rooms=${rooms.length}, galleries=${roomGalleries.length}`);

  } catch (error) {
    console.error('❌ Error in enhanced parsing:', error);
  }

  return data;
}

// Simple DOM-like parser for Edge Runtime (without external dependencies)
function createSimpleDOMParser(html: string) {
  return {
    querySelector: (selector: string) => {
      // Simple implementation for basic selectors
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        const match = html.match(new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>([^<]*)<`, 'i'));
        return match ? { textContent: match[1], getAttribute: (attr: string) => null } : null;
      } else if (selector === 'h1') {
        const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        return match ? { textContent: match[1] } : null;
      } else if (selector === 'title') {
        const match = html.match(/<title>([^<]+)<\/title>/i);
        return match ? { textContent: match[1] } : null;
      }
      return null;
    },
    
    querySelectorAll: (selector: string) => {
      const results: any[] = [];
      
      if (selector === 'img[src*="cdn.worldota.net"]') {
        const matches = html.matchAll(/<img[^>]+src\s*=\s*['"]([^'"]*cdn\.worldota\.net[^'"]*)['"]/gi);
        for (const match of matches) {
          results.push({
            getAttribute: (attr: string) => attr === 'src' ? match[1] : null,
            textContent: ''
          });
        }
      } else if (selector === 'script') {
        const matches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        for (const match of matches) {
          results.push({
            textContent: match[1]
          });
        }
      } else if (selector.includes('amenity') || selector.includes('Amenity')) {
        const matches = html.matchAll(/<[^>]+class="[^"]*(?:amenity|Amenity)[^"]*"[^>]*>([^<]*)</gi);
        for (const match of matches) {
          results.push({
            textContent: match[1]
          });
        }
      }
      
      return results;
    }
  };
}