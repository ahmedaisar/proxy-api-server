//import { RateLimiter } from '../../src/middleware/rateLimiter';

import * as cheerio from 'cheerio';

export const config = {
  runtime: 'nodejs',  // Changed to nodejs to support Cheerio
};

// Create a global rate limiter instance
//const rateLimiter = new RateLimiter(60, 60_000);

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

    // // Apply rate limiting
    // const clientIp = getClientIp(req);
    // const rateLimitCheck = rateLimiter.check(clientIp);
    
    // if (!rateLimitCheck.allowed) {
    //   return new Response(JSON.stringify({
    //     error: "Rate limit exceeded. Please try again later.",
    //     rateLimitRemaining: rateLimitCheck.remaining,
    //     timestamp: new Date().toISOString()
    //   }), { status: 429, headers: corsHeaders });
    // }

  let hotelUrl: string;
  let masterId: string;
  let otaHotelId: string;
  let regionSlug: string;
  let debug = false;

    // Parse parameters based on request method
    if (req.method === 'GET') {
      const url = new URL(req.url, `https://${req.headers.get('host') || 'localhost'}`);
      debug = url.searchParams.get('debug') === '1';
      
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
      debug = !!body.debug;
      
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
    const scrapedData = await extractEnhancedHotelData(html, masterId, { debug });

    const responsePayload: any = {
      success: true,
      data: {
        master_id: masterId,
        ota_hotel_id: otaHotelId,
        region_slug: regionSlug,
        source_url: hotelUrl,
        scraped_at: new Date().toISOString(),
        hotel: scrapedData,
        scraper_version: "enhanced_v1.1"
      },
      message: 'Enhanced hotel data scraped successfully'
    };
    if (debug) responsePayload.debug = scrapedData.__debug; // attach debug diagnostics
    return new Response(JSON.stringify(responsePayload), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Enhanced Scraping error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown enhanced scraping error',
      message: 'Failed to scrape enhanced hotel data'
    }), { status: 500, headers: corsHeaders });
  }
}

// Enhanced HTML parsing function using Cheerio
interface ExtractionOptions { debug?: boolean }

async function extractEnhancedHotelData(html: string, masterId: string, opts: ExtractionOptions = {}): Promise<EnhancedScrapedHotelData & { __debug?: any }> {
  const data: EnhancedScrapedHotelData & { __debug?: any } = {};
  const debugInfo: any = {
    phases: [],
    counts: {},
    warnings: []
  };

  try {
    // Parse HTML using Cheerio
    const $ = cheerio.load(html);

    // Extract hotel name using Cheerio
    const nameElement = $('h1').first();
    if (nameElement.length > 0) {
      const name = nameElement.text().trim();
      data.name = name.replace(/\s*[-|]\s*(?:Ostrovok|in\s).*$/i, '').trim();
    } else {
      const titleElement = $('title').first();
      if (titleElement.length > 0) {
        const name = titleElement.text().trim();
        data.name = name.replace(/\s*[-|]\s*(?:Ostrovok|in\s).*$/i, '').trim();
      }
    }

    // Extract rating using Cheerio
    const ratingElement = $('.TotalRating_content__k5u6S').first();
    if (ratingElement.length > 0) {
      const ratingText = ratingElement.text().replace(',', '.');
      data.rating = parseFloat(ratingText);
    }

    // Extract price information using Cheerio
    const priceElement = $('[class*="price"], [class*="Price"]').first();
    if (priceElement.length > 0) {
      const priceText = priceElement.text().match(/[₽$]\s*[\d,]+/);
      if (priceText) {
        data.price = priceText[0];
      }
    }

    // Extract hotel images using Cheerio
    const images: string[] = [];
    $('img[src*="cdn.worldota.net"]').each((_, img) => {
      const src = $(img).attr('src');
      if (src && 
          !src.includes('data:') && 
          !src.includes('.js') && 
          !src.includes('webpack') &&
          src.match(/\.(jpg|jpeg|png|webp)/) &&
          !images.includes(src)) {
        images.push(src);
      }
    });
    
    if (images.length > 0) {
      data.images = images.slice(0, 15);
    }

    // Extract enhanced room information and room galleries using Cheerio
    const rooms: any[] = [];
    const roomGalleries: any[] = [];

    // Look for room cards or sections that might have clickable elements
    $('[class*="Room"], [class*="room"], [data-room], button[class*="room"]').each((_, roomSection) => {
      const $roomSection = $(roomSection);
      const roomData: any = {};
      
      // Extract room type from various possible locations
      const roomTypeElement = $roomSection.find('[class*="title"], [class*="name"], h2, h3, h4').first();
      if (roomTypeElement.length > 0) {
        const roomType = roomTypeElement.text().trim();
        if (roomType && roomType.length > 3 && roomType.length < 100) {
          roomData.type = roomType;
        }
      } else {
        // Try to get text from the element itself
        const roomType = $roomSection.text().trim();
        if (roomType && roomType.length > 3 && roomType.length < 100) {
          roomData.type = roomType;
        }
      }

      // Extract room price
      const roomPriceElement = $roomSection.find('[class*="price"], [class*="Price"]').first();
      if (roomPriceElement.length > 0) {
        const priceMatch = roomPriceElement.text().match(/[₽$]\s*[\d,]+/);
        if (priceMatch) {
          roomData.price = priceMatch[0];
        }
      }

      // Extract room amenities
      const roomAmenities: string[] = [];
      $roomSection.find('[class*="amenity"], [class*="feature"]').each((_, amenity) => {
        const amenityText = $(amenity).text().trim();
        if (amenityText && amenityText.length > 2 && amenityText.length < 50) {
          roomAmenities.push(amenityText);
        }
      });
      
      if (roomAmenities.length > 0) {
        roomData.amenities = roomAmenities;
      }

      // Extract bed type information
      const bedElement = $roomSection.find('[class*="bed"], [class*="Bed"]').first();
      if (bedElement.length > 0) {
        roomData.bed_type = bedElement.text().trim();
      }

      // Extract room size
      const sizeElement = $roomSection.find('[class*="size"], [class*="m²"], [class*="sqm"]').first();
      if (sizeElement.length > 0) {
        const sizeMatch = sizeElement.text().match(/\d+\s*m²/);
        if (sizeMatch) {
          roomData.size = sizeMatch[0];
        }
      }

      if (Object.keys(roomData).length > 0) {
        rooms.push(roomData);
      }
    });

    if (rooms.length > 0) {
      data.rooms = rooms;
    }

    // Extract room galleries from DesktopPopup structures using Cheerio (Phase 1)
    let desktopPopupCount = 0;
    $('.DesktopPopup_root__iVcfK').each((_, popup) => {
      const $popup = $(popup);
      
      // Get room type from popup title
      const roomTitle = $popup.find('.DesktopPopup_title__KCelg').first().text().trim();
      
      if (roomTitle) {
        const roomImages: string[] = [];
        const thumbnails: string[] = [];
        
        // Extract images from ImagesLayout_wrapper
        $popup.find('.ImagesLayout_wrapper__yh9dY img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && src.includes('cdn.worldota.net') && src.match(/\.(jpg|jpeg|png|webp)/)) {
            roomImages.push(src);
          }
        });
        
        // Extract images from Gallery slides
        $popup.find('.Gallery_slide__D99ch img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && src.includes('cdn.worldota.net') && src.match(/\.(jpg|jpeg|png|webp)/) && !roomImages.includes(src)) {
            roomImages.push(src);
          }
        });
        
        // Extract thumbnails from Thumbnails section
        $popup.find('.Thumbnails_root__RgHkA img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && src.includes('cdn.worldota.net') && src.match(/\.(jpg|jpeg|png|webp)/)) {
            thumbnails.push(src);
          }
        });
        
        if (roomImages.length > 0) {
          roomGalleries.push({
            room_type: roomTitle,
            images: roomImages.slice(0, 15),
            thumbnails: thumbnails.slice(0, 8)
          });
        }
        desktopPopupCount++;
      }
    });

    if (roomGalleries.length > 0) {
      data.room_galleries = roomGalleries;
    }

    debugInfo.counts.desktopPopupGalleries = desktopPopupCount;

    // Phase 2: Fallback - BaseGallery roots (thumbnails before click)
    if (!data.room_galleries || data.room_galleries.length === 0) {
      const baseGalleryRooms: any[] = [];
      $('[class^="BaseGallery_root"], [class*=" BaseGallery_root"]').each((_, gal) => {
        const $gal = $(gal);
        const parentText = $gal.parent().text().trim().split('\n')[0];
        const potentialTitle = parentText && parentText.length < 80 ? parentText : undefined;
        const imgs: string[] = [];
        $gal.find('img').each((_, img) => {
          const src = $(img).attr('src');
            if (src && src.includes('cdn.worldota.net') && /\.(jpg|jpeg|png|webp)/.test(src) && !imgs.includes(src)) {
              imgs.push(src);
            }
        });
        if (imgs.length) {
          baseGalleryRooms.push({ room_type: potentialTitle || 'Gallery', images: imgs.slice(0, 12), thumbnails: imgs.slice(0, 6) });
        }
      });
      if (baseGalleryRooms.length) {
        data.room_galleries = baseGalleryRooms;
        debugInfo.phases.push('baseGalleryFallback');
      }
      debugInfo.counts.baseGalleryRooms = baseGalleryRooms.length;
    }

    // Phase 3: Parse inline JSON structures in <script> tags (React hydration data)
    if (!data.room_galleries || data.room_galleries.length === 0) {
      const jsonRoomGalleries: any[] = [];
      $('script').each((_, script) => {
        const content = $(script).html() || '';
        if (content.includes('worldota') && content.includes('room')) {
          // Try to locate JSON objects with image URLs
          const galleryJsonMatches = content.match(/\{[^{}]*?(?:room|title)[^{}]*?cdn\\.worldota[^{}]*?\}/g);
          if (galleryJsonMatches) {
            galleryJsonMatches.forEach(raw => {
              // Relaxed sanitation
              const cleaned = raw
                .replace(/(\w+)\s*:/g, '"$1":')
                .replace(/'(https?:[^']+)'/g, '"$1"');
              try {
                const maybe = JSON.parse(cleaned);
                const urls = JSON.stringify(maybe).match(/https:\/\/cdn\.worldota\.net[^"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
                if (urls.length) {
                  jsonRoomGalleries.push({ room_type: maybe.title || maybe.room_type || 'Room', images: Array.from(new Set(urls)).slice(0, 15) });
                }
              } catch { /* ignore JSON parse issues */ }
            });
          }
        }
      });
      if (jsonRoomGalleries.length) {
        data.room_galleries = jsonRoomGalleries;
        debugInfo.phases.push('scriptJsonFallback');
      }
      debugInfo.counts.jsonRoomGalleries = jsonRoomGalleries.length;
    }

    // Phase 4: Heuristic block parsing - find title followed by cluster of images in proximity
    if (!data.room_galleries || data.room_galleries.length === 0) {
      const heuristicGalleries: any[] = [];
      const titles: string[] = [];
      $('h2, h3, h4, [class*="title"], [class*="Title"]').each((_, el) => {
        const txt = $(el).text().trim();
        if (txt && txt.length > 3 && txt.length < 100 && /room|villa|suite|bungalow|делюкс|вилла|сьют/i.test(txt) && !titles.includes(txt)) {
          titles.push(txt);
          // Search next siblings for images
          const imagesCluster: string[] = [];
          let sibling = $(el).next();
          let hops = 0;
          while (sibling.length && hops < 5 && imagesCluster.length < 20) {
            sibling.find('img').each((_, img) => {
              const src = $(img).attr('src');
              if (src && src.includes('cdn.worldota.net') && /\.(jpg|jpeg|png|webp)/.test(src) && !imagesCluster.includes(src)) {
                imagesCluster.push(src);
              }
            });
            sibling = sibling.next();
            hops++;
          }
          if (imagesCluster.length >= 3) {
            heuristicGalleries.push({ room_type: txt, images: imagesCluster.slice(0, 15), thumbnails: imagesCluster.slice(0, 6) });
          }
        }
      });
      if (heuristicGalleries.length) {
        data.room_galleries = heuristicGalleries;
        debugInfo.phases.push('heuristicTitleCluster');
      }
      debugInfo.counts.heuristicGalleries = heuristicGalleries.length;
    }

    // Deduplicate galleries by room_type
    if (data.room_galleries && data.room_galleries.length > 1) {
      const seen = new Map<string, any>();
      for (const g of data.room_galleries) {
        const key = (g.room_type || 'Room').toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, g);
        } else {
          // merge images
          const existing = seen.get(key);
            existing.images = Array.from(new Set([...(existing.images||[]), ...(g.images||[])]));
            if (g.thumbnails) {
              existing.thumbnails = Array.from(new Set([...(existing.thumbnails||[]), ...(g.thumbnails||[])]));
            }
        }
      }
      data.room_galleries = Array.from(seen.values());
      debugInfo.counts.dedupedRoomGalleries = data.room_galleries.length;
    }

    // Extract additional room gallery data from JavaScript using Cheerio
    $('script').each((_, script) => {
      const scriptContent = $(script).html();
      
      if (scriptContent) {
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
    });

    // Extract amenities using Cheerio
    const amenities: string[] = [];
    $('[class*="amenity"], [class*="Amenity"], [class*="feature"]').each((_, amenity) => {
      const amenityText = $(amenity).text().trim();
      if (amenityText && amenityText.length > 2 && amenityText.length < 50 && 
          !amenityText.includes('ref=') && !amenities.includes(amenityText)) {
        amenities.push(amenityText);
      }
    });
    
    if (amenities.length > 0) {
      data.amenities = amenities.slice(0, 25);
    }

    // Extract review count using Cheerio
    $('[class*="review"], [class*="Review"]').each((_, review) => {
      const reviewMatch = $(review).text().match(/(\d+)\s+reviews/i);
      if (reviewMatch && reviewMatch[1]) {
        data.review_count = parseInt(reviewMatch[1]);
        return false; // Break out of the loop
      }
    });

    // Extract additional hotel details using more comprehensive Cheerio parsing
    
    // Extract location/address
    const locationSelectors = [
      'address', 
      '[class*="address"]', 
      '[class*="location"]',
      '[class*="Location"]'
    ];
    
    for (const selector of locationSelectors) {
      const locationElement = $(selector).first();
      if (locationElement.length > 0) {
        data.location = locationElement.text().trim();
        break;
      }
    }

    // Extract hotel facts (check-in/out times, room count, etc.)
    const hotelFacts: any = {};
    
    // Check-in time
    const checkinElement = $(':contains("Check-in")').next();
    if (checkinElement.length > 0) {
      const checkinMatch = checkinElement.text().match(/(\d{2}:\d{2})/);
      if (checkinMatch) {
        hotelFacts.checkin = checkinMatch[1];
      }
    }
    
    // Check-out time
    const checkoutElement = $(':contains("Check-out")').next();
    if (checkoutElement.length > 0) {
      const checkoutMatch = checkoutElement.text().match(/(\d{2}:\d{2})/);
      if (checkoutMatch) {
        hotelFacts.checkout = checkoutMatch[1];
      }
    }
    
    // Room count
    const roomCountElement = $(':contains("rooms")');
    if (roomCountElement.length > 0) {
      const roomCountMatch = roomCountElement.text().match(/(\d+)\s+rooms/i);
      if (roomCountMatch && roomCountMatch[1]) {
        hotelFacts.rooms = parseInt(roomCountMatch[1]);
      }
    }
    
    if (Object.keys(hotelFacts).length > 0) {
      data.hotel_facts = hotelFacts;
    }

    console.log(`✅ Enhanced Cheerio extraction completed: name=${data.name}, rating=${data.rating}, rooms=${rooms.length}, galleries=${(data.room_galleries||[]).length}, amenities=${amenities.length}`);
    debugInfo.counts.finalRoomGalleries = (data.room_galleries||[]).length;

  } catch (error) {
    console.error('❌ Error in enhanced parsing:', error);
    debugInfo.warnings.push('enhancedParsingError');
  }

  if (opts.debug) data.__debug = debugInfo;

  return data;
}

// Note: This enhanced scraper uses Cheerio for proper HTML parsing
// and focuses on extracting room gallery information from DesktopPopup structures