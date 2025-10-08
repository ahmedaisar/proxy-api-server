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

interface ScrapedHotelData {
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
    images?: string[];
  }[];
  room_images?: {
    room_type?: string;
    images?: string[];
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
          "GET /api/ov/scrape?master_id=6669997",
          "POST /api/ov/scrape with JSON body"
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
                option_1: '/api/ov/scrape?url=https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/',
                option_2: '/api/ov/scrape?master_id=6669997&ota_hotel_id=canareef_resort_maldives&region_slug=maldives/addu_atoll'
              }
            ]
          }), { status: 400, headers: corsHeaders });
        }
      }
    } else {
      // POST request with hotel object
      const body = await req.json();
      
      if (body.url) {
        // Direct URL in POST body
        hotelUrl = body.url;
        const midMatch = hotelUrl.match(/mid(\d+)/);
        masterId = midMatch?.[1] || 'unknown';
        otaHotelId = 'from-url';
        regionSlug = 'from-url';
      } else if (body.hotel) {
        // Complete hotel object from search results
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
            message: 'Hotel object must contain: master_id, ota_hotel_id, and static_vm.region_catalog_slug',
            example: {
              hotel: {
                master_id: 6669997,
                ota_hotel_id: "canareef_resort_maldives",
                static_vm: {
                  region_catalog_slug: "maldives/addu_atoll"
                }
              }
            }
          }), { status: 400, headers: corsHeaders });
        }
      } else {
        // Individual parameters in POST body
        masterId = body.master_id?.toString() || '';
        otaHotelId = body.ota_hotel_id || '';
        regionSlug = body.region_slug || '';
        
        if (masterId && otaHotelId && regionSlug) {
          hotelUrl = `https://ostrovok.ru/hotel/${regionSlug}/mid${masterId}/${otaHotelId}/`;
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing required parameters in POST body',
            message: 'Provide either "url", "hotel" object, OR individual parameters: master_id, ota_hotel_id, region_slug',
            examples: [
              { 
                url: "https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/"
              },
              {
                hotel: {
                  master_id: 6669997,
                  ota_hotel_id: "canareef_resort_maldives",
                  static_vm: { region_catalog_slug: "maldives/addu_atoll" }
                }
              }
            ]
          }), { status: 400, headers: corsHeaders });
        }
      }
    }

    // Validate master_id is numeric (if not from URL)
    if (masterId !== 'unknown' && !/^\d+$/.test(masterId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid master_id format',
        message: 'master_id must be a numeric value'
      }), { status: 400, headers: corsHeaders });
    }

    console.log(`🔍 Scraping hotel data:`);
    console.log(`   Master ID: ${masterId}`);
    console.log(`   OTA Hotel ID: ${otaHotelId}`);
    console.log(`   Region Slug: ${regionSlug}`);
    
    console.log(`🌐 Fetching: ${hotelUrl}`);

    // Fetch the hotel page
    const response = await fetch(hotelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hotel page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ Fetched HTML content (${html.length} chars)`);

    // Parse HTML and extract structured data
    const scrapedData = await extractHotelData(html, masterId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        master_id: masterId,
        ota_hotel_id: otaHotelId,
        region_slug: regionSlug,
        source_url: hotelUrl,
        scraped_at: new Date().toISOString(),
        hotel: scrapedData
      },
      message: 'Hotel data scraped successfully'
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ Scraping error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown scraping error',
      message: 'Failed to scrape hotel data'
    }), { status: 500, headers: corsHeaders });
  }
}

// HTML parsing function to extract structured hotel data
async function extractHotelData(html: string, masterId: string): Promise<ScrapedHotelData> {
  const data: ScrapedHotelData = {};

  try {
    // Extract hotel name - multiple patterns
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title>([^<]+?)\s*[-|]\s*(?:Ostrovok|in\s)/i) ||
                     html.match(/heading\s+"([^"]+)"\s+\[level=1\]/i);
    if (nameMatch && nameMatch[1]) {
      data.name = nameMatch[1].trim().replace(/\s+/g, ' ');
    }

    // Extract rating - enhanced patterns for Ostrovok (fix: look for actual display rating, not star rating)
    const ratingMatch = html.match(/<span class="TotalRating_content__k5u6S">(\d+[,.]?\d*)<\/span>/i) || 
                       html.match(/"ratingValue":\s*"(\d+\.?\d*)"/i) ||
                       html.match(/rating['"]\s*:\s*([0-9.]+)/i) || 
                       html.match(/(\d+\.\d+)\s*\/\s*10/i);
    if (ratingMatch && ratingMatch[1]) {
      // Handle both comma and dot decimal separators
      const ratingValue = ratingMatch[1].replace(',', '.');
      data.rating = parseFloat(ratingValue);
    }

    // Extract price information - enhanced for Ostrovok pricing
    const priceMatch = html.match(/from\s*₽\s*([0-9,]+)/i) ||
                      html.match(/paragraph\s+\[ref=[^>]*\]:\s*from\s*₽\s*([0-9,]+)/i) ||
                      html.match(/price['"]\s*:\s*['"]*([0-9,]+)/i) ||
                      html.match(/(\$\d+(?:,\d{3})*|\d+(?:,\d{3})*\s*₽)/i);
    if (priceMatch && priceMatch[1]) {
      data.price = `₽ ${priceMatch[1]}`;
    }

    // Extract location/address - enhanced for full address
    const locationAddressMatch = html.match(/paragraph\s+\[ref=[^>]*\]:\s*([^\\n]+Maldives[^\\n]*)/i) ||
                                html.match(/text:\s*([^\\n]+Maldives[^\\n]*)/i) ||
                                html.match(/address['"]\s*:\s*['"]([^'"]+)['"]/i) ||
                                html.match(/<address[^>]*>([^<]+)<\/address>/i);
    if (locationAddressMatch && locationAddressMatch[1]) {
      data.location = locationAddressMatch[1].trim().replace(/\s+/g, ' ');
    }

    // Extract images (fix: filter out JavaScript files and invalid URLs)
    const images: string[] = [];
    const imageMatches = html.matchAll(/src\s*=\s*['"]([^'"]*(?:jpg|jpeg|png|webp)[^'"]*)['"]/gi);
    for (const match of imageMatches) {
      const imgUrl = match[1];
      if (imgUrl && 
          !imgUrl.includes('data:') && 
          !imgUrl.includes('.js') && 
          !imgUrl.includes('webpack') &&
          !imgUrl.includes('chunk') &&
          imgUrl.startsWith('http') &&
          !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }
    if (images.length > 0) {
      data.images = images.slice(0, 10); // Limit to first 10 images
    }

    // Extract amenities - enhanced for Ostrovok structure
    const amenities: string[] = [];
    
    // Extract from listitem patterns (Ostrovok uses this structure)
    const amenityMatches = html.matchAll(/listitem\s+\[ref=[^\]]*\]:[^:]*generic\s+\[ref=[^\]]*\]:\s*([^\\n]+)/gi);
    for (const match of amenityMatches) {
      const amenity = match[1]?.trim();
      if (amenity && amenity.length > 2 && amenity.length < 50 && 
          !amenity.includes('ref=') && !amenity.includes('[') && 
          !amenities.includes(amenity)) {
        amenities.push(amenity);
      }
    }
    
    // Extract from common patterns
    const commonPatterns = [
      /Free Internet/gi, /Free Wi-Fi/gi, /Swimming Pool/gi, /Fitness centre/gi,
      /Transfer/gi, /Suitable for children/gi, /Air conditioning/gi, /Restaurant/gi,
      /Bar/gi, /Spa/gi, /Beach facilities/gi, /Gym/gi, /Elevator/gi,
      /24-hour reception/gi, /Diving/gi, /Snorkelling/gi, /Tennis court/gi
    ];
    
    for (const pattern of commonPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        const amenity = matches[0];
        if (!amenities.some(a => a.toLowerCase() === amenity.toLowerCase())) {
          amenities.push(amenity);
        }
      }
    }
    
    if (amenities.length > 0) {
      data.amenities = amenities.slice(0, 20); // Increased limit for rich amenity data
    }

    // Extract review count
    const reviewCountMatch = html.match(/(\d+)\s+reviews/i) ||
                            html.match(/Based on (\d+) reviews/i);
    if (reviewCountMatch && reviewCountMatch[1]) {
      data.review_count = parseInt(reviewCountMatch[1]);
    }

    // Extract detailed review scores
    const reviewScores: any = {};
    const scorePatterns = [
      { key: 'cleanliness', pattern: /Cleanliness[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'location', pattern: /Location[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'service', pattern: /Service[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'meals', pattern: /Meals[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'value', pattern: /Value for money[^"]*(\d+(?:\.\d+)?)/ },
      { key: 'room', pattern: /Room[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'wifi', pattern: /Wi-Fi quality[^"]*(\d+(?:\.\d+)?)/ }
    ];

    for (const { key, pattern } of scorePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        reviewScores[key] = parseFloat(match[1]);
      }
    }

    if (Object.keys(reviewScores).length > 0) {
      data.review_scores = reviewScores;
    }

    // Extract hotel facts
    const hotelFacts: any = {};
    
    const roomCountMatch = html.match(/(\d+)\s+rooms/i);
    if (roomCountMatch && roomCountMatch[1]) {
      hotelFacts.rooms = parseInt(roomCountMatch[1]);
    }

    const checkinMatch = html.match(/After\s+(\d{2}:\d{2})/i) || 
                        html.match(/Check-in[^A]*After\s+(\d{2}:\d{2})/i);
    if (checkinMatch && checkinMatch[1]) {
      hotelFacts.checkin = checkinMatch[1];
    }

    const checkoutMatch = html.match(/Until\s+(\d{2}:\d{2})/i) ||
                         html.match(/Check-out[^U]*Until\s+(\d{2}:\d{2})/i);
    if (checkoutMatch && checkoutMatch[1]) {
      hotelFacts.checkout = checkoutMatch[1];
    }

    // Extract children policies (fix: look for clean policy text, not HTML fragments)
    const childrenPolicies: string[] = [];
    
    // Look for children policy in structured sections
    const childrenSectionMatch = html.match(/<div class="PolicyBlock_title__iMvQT[^>]*>Children<\/div>[\s\S]*?<ul class="BasePolicyBlock_list__6QOPP">([\s\S]*?)<\/ul>/i);
    if (childrenSectionMatch && childrenSectionMatch[1]) {
      const policyItems = childrenSectionMatch[1].matchAll(/<li class="BasePolicyBlock_listItem__kB5t1"><div[^>]*>([^<]+)<\/div>/g);
      for (const match of policyItems) {
        if (match[1] && match[1].trim()) {
          const cleanPolicy = match[1].trim().replace(/\s+/g, ' ');
          if (cleanPolicy.length > 10) {
            childrenPolicies.push(cleanPolicy);
          }
        }
      }
    }
    
    // Alternative: look for age-based policies in policy paragraphs
    const agePolicyMatches = html.matchAll(/<div class="PolicyBlock_paragraph__2bmGu">([^<]*(?:age|years?|children)[^<]*)<\/div>/gi);
    for (const match of agePolicyMatches) {
      const policy = match[1]?.trim();
      if (policy && policy.length > 10 && !childrenPolicies.some(p => p.toLowerCase().includes(policy.toLowerCase().substring(0, 20)))) {
        childrenPolicies.push(policy);
      }
    }
    
    if (childrenPolicies.length > 0) {
      hotelFacts.children_policy = childrenPolicies.slice(0, 5); // Limit to 5 most relevant policies
    }

    if (Object.keys(hotelFacts).length > 0) {
      data.hotel_facts = hotelFacts;
    }

    // Extract basic description
    const descMatch = html.match(/<meta\s+name\s*=\s*['"]description['"][^>]*content\s*=\s*['"]([^'"]{100,})['"]/i) ||
                     html.match(/<p[^>]*>([^<]{200,}?)<\/p>/i);
    if (descMatch && descMatch[1]) {
      data.description = descMatch[1].trim().substring(0, 500);
    }

    // Extract detailed descriptions using CSS class patterns (fix: use Russian text)
    const detailedDescription: any = {};

    // Extract location information - Russian "Расположение"
    const locationDescMatch = html.match(/<p class="About_descriptionTitle__POYEB">Расположение<\/p><p class="About_descriptionParagraph__xWYso">([^<]+)<\/p>/i);
    if (locationDescMatch && locationDescMatch[1]) {
      detailedDescription.location_info = locationDescMatch[1].trim();
    }

    // Extract "На курорте" (At the resort) section - multiple paragraphs
    let resortInfo = '';
    const resortSectionMatch = html.match(/<p class="About_descriptionTitle__POYEB">На курорте<\/p>([\s\S]*?)(?=<p class="About_descriptionTitle__POYEB">|<\/div>)/i);
    if (resortSectionMatch && resortSectionMatch[1]) {
      const paragraphMatches = resortSectionMatch[1].matchAll(/<p class="About_descriptionParagraph__xWYso">([^<]+)<\/p>/g);
      const paragraphs: string[] = [];
      for (const pMatch of paragraphMatches) {
        if (pMatch[1]) {
          paragraphs.push(pMatch[1].trim());
        }
      }
      if (paragraphs.length > 0) {
        resortInfo = paragraphs.join(' ');
      }
    }
    if (resortInfo) {
      detailedDescription.resort_facilities = resortInfo;
    }

    // Extract room amenities information - Russian "В номере"
    const roomAmenitiesMatch = html.match(/<p class="About_descriptionTitle__POYEB">В номере<\/p><p class="About_descriptionParagraph__xWYso">([^<]+)<\/p>/i);
    if (roomAmenitiesMatch && roomAmenitiesMatch[1]) {
      detailedDescription.room_amenities = roomAmenitiesMatch[1].trim();
    }

    // Combine all description paragraphs for full description
    const allDescriptionParagraphs = html.matchAll(/<p class="About_descriptionParagraph__xWYso">([^<]+)<\/p>/g);
    const allDescTexts: string[] = [];
    for (const match of allDescriptionParagraphs) {
      if (match[1] && match[1].trim()) {
        allDescTexts.push(match[1].trim());
      }
    }
    if (allDescTexts.length > 0) {
      detailedDescription.full_description = allDescTexts.join(' ');
    }

    // Extract electrical socket types from Facts section
    const socketTypes: string[] = [];
    const socketMatches = html.matchAll(/<p>Type ([GJKL])<\/p>/g);
    for (const match of socketMatches) {
      if (match[1] && !socketTypes.includes(`Type ${match[1]}`)) {
        socketTypes.push(`Type ${match[1]}`);
      }
    }

    if (Object.keys(detailedDescription).length > 0) {
      data.detailed_description = detailedDescription;
    }

    // Update hotel_facts to include electrical sockets
    if (socketTypes.length > 0) {
      if (!data.hotel_facts) data.hotel_facts = {};
      data.hotel_facts.electrical_sockets = socketTypes;
    }

    // Extract Additional Information section (fix: look for Russian "Дополнительная информация")
    const additionalInfo: any = {};
    
    // Look for both English and Russian versions of "Additional information"
    const additionalInfoMatch = html.match(/<h3 class="Section_title__XmYEu">(?:Additional information|Дополнительная информация)<\/h3>[\s\S]*?<div class="Section_content__kI4t6">([\s\S]*?)(?=<\/div>(?:<\/div>)*<(?:\/div|div class="Section_wrapper))/i);
    if (additionalInfoMatch && additionalInfoMatch[1]) {
      // Extract all policy paragraphs - fix regex to handle clean text
      const policyMatches = additionalInfoMatch[1].matchAll(/<div class="PolicyBlock_paragraph__2bmGu">([^<]+)<\/div>/g);
      const policies: string[] = [];
      let fullText = '';
      
      for (const match of policyMatches) {
        if (match[1] && match[1].trim()) {
          let cleanText = match[1].trim().replace(/\s+/g, ' ');
          // Remove any remaining HTML entities
          cleanText = cleanText.replace(/&[a-zA-Z0-9#]+;/g, '').trim();
          
          if (cleanText.length > 5) { // Filter out empty or very short entries
            policies.push(cleanText);
            fullText += cleanText + ' ';
          }
        }
      }
      
      // Also look for table cell content in additional info section
      const tableCellMatches = additionalInfoMatch[1].matchAll(/<td class="PolicyBlock_policyTableCell__0zZxx">([^<]+)<\/td>/g);
      for (const match of tableCellMatches) {
        if (match[1] && match[1].trim()) {
          let cleanText = match[1].trim().replace(/\s+/g, ' ');
          if (cleanText.length > 5 && !policies.includes(cleanText)) {
            policies.push(cleanText);
            fullText += cleanText + ' ';
          }
        }
      }
      
      if (policies.length > 0) {
        additionalInfo.policies = policies;
        additionalInfo.full_additional_info = fullText.trim();
        
        // Extract specific information types
        const transferPolicies = policies.filter(p => 
          p.toLowerCase().includes('transfer') || 
          p.toLowerCase().includes('airport') || 
          p.toLowerCase().includes('flight') ||
          p.toLowerCase().includes('трансфер')
        );
        
        if (transferPolicies.length > 0) {
          additionalInfo.transfer_details = transferPolicies.join(' ');
        }
        
        // Extract pricing information
        const pricingPolicies = policies.filter(p => 
          p.includes('USD') || p.includes('₽') || p.includes('$') ||
          p.toLowerCase().includes('cost') || 
          p.toLowerCase().includes('fee') ||
          p.toLowerCase().includes('supplement') ||
          p.toLowerCase().includes('price')
        );
        
        if (pricingPolicies.length > 0) {
          additionalInfo.pricing_info = pricingPolicies.join(' ');
        }
      }
    }
    
    if (Object.keys(additionalInfo).length > 0) {
      data.additional_info = additionalInfo;
    }

    // Extract contact information
    const phoneMatch = html.match(/phone['"]\s*:\s*['"]([^'"]+)['"]/i) ||
                      html.match(/tel:([+\d\s\-()]+)/i);
    const emailMatch = html.match(/email['"]\s*:\s*['"]([^'"]+@[^'"]+)['"]/i) ||
                      html.match(/mailto:([^'">\s]+@[^'">\s]+)/i);
    const websiteMatch = html.match(/website['"]\s*:\s*['"]([^'"]+)['"]/i);

    if (phoneMatch || emailMatch || websiteMatch) {
      data.contact = {};
      if (phoneMatch && phoneMatch[1]) data.contact.phone = phoneMatch[1];
      if (emailMatch && emailMatch[1]) data.contact.email = emailMatch[1];
      if (websiteMatch && websiteMatch[1]) data.contact.website = websiteMatch[1];
    }

    // Try to extract JSON-LD structured data if available
    const jsonLdMatch = html.match(/<script[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([^<]+)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd['@type'] === 'Hotel' || jsonLd['@type'] === 'LodgingBusiness') {
          if (jsonLd.name) data.name = jsonLd.name;
          if (jsonLd.aggregateRating?.ratingValue) data.rating = parseFloat(jsonLd.aggregateRating.ratingValue);
          if (jsonLd.address) {
            if (typeof jsonLd.address === 'string') {
              data.location = jsonLd.address;
            } else if (jsonLd.address.streetAddress) {
              data.location = jsonLd.address.streetAddress;
            }
          }
        }
      } catch (e) {
        console.log('Failed to parse JSON-LD:', e);
      }
    }

    // Extract room images from DesktopPopup gallery sections
    const roomImages: { room_type?: string; images?: string[] }[] = [];
    
    // Find all DesktopPopup sections that contain room galleries
    const roomPopupMatches = html.matchAll(/<div class="DesktopPopup_root__iVcfK">[\s\S]*?<div class="DesktopPopup_title__KCelg">([^<]+)<\/div>[\s\S]*?<ul class="ImagesLayout_wrapper__yh9dY[^"]*">([\s\S]*?)<\/ul>[\s\S]*?<\/div>/gi);
    
    for (const popupMatch of roomPopupMatches) {
      const roomType = popupMatch[1]?.trim();
      const galleryContent = popupMatch[2];
      
      if (roomType && galleryContent) {
        const images: string[] = [];
        
        // Extract image URLs from the gallery
        const imageMatches = galleryContent.matchAll(/src\s*=\s*['"]([^'"]*cdn\.worldota\.net[^'"]*(?:jpg|jpeg|png|webp)[^'"]*)['"]/gi);
        
        for (const imgMatch of imageMatches) {
          const imgUrl = imgMatch[1];
          if (imgUrl && !imgUrl.includes('data:') && !images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }
        
        // Also extract from srcset attributes for higher quality images
        const srcsetMatches = galleryContent.matchAll(/srcset\s*=\s*['"]([^'"]*cdn\.worldota\.net[^'"]*(?:jpg|jpeg|png|webp)[^'"]*)['"]/gi);
        
        for (const srcsetMatch of srcsetMatches) {
          const imgUrl = srcsetMatch[1];
          if (imgUrl && !imgUrl.includes('data:') && !images.includes(imgUrl)) {
            images.push(imgUrl);
          }
        }
        
        if (images.length > 0) {
          roomImages.push({
            room_type: roomType,
            images: images.slice(0, 15) // Limit to 15 images per room type
          });
        }
      }
    }
    
    // Also try to extract room images from Gallery slides if available
    const gallerySlideMatches = html.matchAll(/<div class="Gallery_slide__D99ch[^"]*">[\s\S]*?<img[^>]+src\s*=\s*['"]([^'"]*cdn\.worldota\.net[^'"]*(?:jpg|jpeg|png|webp)[^'"]*)['"]/gi);
    
    let galleryImages: string[] = [];
    for (const slideMatch of gallerySlideMatches) {
      const imgUrl = slideMatch[1];
      if (imgUrl && !imgUrl.includes('data:') && !galleryImages.includes(imgUrl)) {
        galleryImages.push(imgUrl);
      }
    }
    
    // If we found gallery images but no specific room popups, add them as general room images
    if (galleryImages.length > 0 && roomImages.length === 0) {
      roomImages.push({
        room_type: "Hotel Room Gallery",
        images: galleryImages.slice(0, 15)
      });
    }
    
    if (roomImages.length > 0) {
      data.room_images = roomImages;
    }

    console.log(`✅ Extracted data: name=${data.name}, rating=${data.rating}, images=${data.images?.length || 0}, room_images=${roomImages.length} room types`);

  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
  }

  return data;
}