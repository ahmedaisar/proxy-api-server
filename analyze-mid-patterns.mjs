#!/usr/bin/env node

// Analysis of hotel identifier patterns from known examples
console.log('🔍 Hotel MID Identifier Pattern Analysis\n');
console.log('='.repeat(60));

// Known hotel URL patterns from Ostrovok
const knownHotelUrls = [
  'https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/',
  'https://ostrovok.ru/hotel/maldives/meedhoo_(raa_atoll)/mid8755291/reethi_faru_resort/',
  // Add more as we discover them
];

console.log('📋 Known Hotel URL Patterns:');
knownHotelUrls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
  
  // Extract components
  const urlParts = url.split('/');
  const midMatch = url.match(/mid(\d+)/);
  const hotelName = urlParts[urlParts.length - 2]; // Second to last part
  const location = urlParts[urlParts.length - 4]; // Fourth from last
  
  if (midMatch) {
    console.log(`   MID: ${midMatch[0]} (numeric: ${midMatch[1]})`);
    console.log(`   Location: ${location}`);
    console.log(`   Hotel Name: ${hotelName}`);
  }
  console.log('');
});

// Plan for finding MID in API responses
console.log('🎯 Strategy for Finding MID in API Responses:');
console.log('='.repeat(50));

console.log(`
1. 🔍 SEARCH API ANALYSIS:
   - Look for hotel objects in search results
   - Check for 'id', 'hotel_id', 'mid', 'code' fields
   - Check for URL fields containing 'mid' pattern
   - Check nested objects for identifiers

2. 🏨 COMMON FIELD NAMES TO CHECK:
   - hotel.id, hotel.hotel_id, hotel.mid
   - hotel.code, hotel.property_id
   - hotel.url, hotel.link, hotel.href
   - hotel.slug, hotel.permalink
   - hotel.ostrovok_id, hotel.internal_id

3. 🔗 URL PATTERN EXTRACTION:
   - Look for fields containing "/mid[0-9]+/"
   - Extract numeric part after "mid"
   - Match hotel names with slugified versions

4. 📝 IMPLEMENTATION PLAN:
   - Add mid extraction to search endpoint response
   - Create mapping function: hotel_name -> mid
   - Create scraping endpoint: /api/ov/scrape?mid=6669997
   - Parse HTML and return structured JSON
`);

// Create a test function to extract MID patterns
function extractMidFromUrl(url) {
  const midMatch = url.match(/mid(\d+)/);
  return midMatch ? {
    full: midMatch[0],
    numeric: midMatch[1]
  } : null;
}

// Test the extraction
console.log('🧪 MID Extraction Test:');
knownHotelUrls.forEach(url => {
  const mid = extractMidFromUrl(url);
  console.log(`${url} -> ${mid ? mid.full : 'No MID found'}`);
});

console.log(`
💡 NEXT STEPS:
1. Run our search endpoint and examine the actual response
2. Look for hotel objects and their ID fields
3. Find which field contains the 'mid' identifier
4. Create mapping between search results and MID values
5. Build scraping endpoint using the MID

🔧 SCRAPING ENDPOINT DESIGN:
   GET /api/ov/scrape?mid=6669997
   -> Scrapes: https://ostrovok.ru/hotel/.../mid6669997/...
   -> Returns: Structured JSON with hotel details
`);

// Template for the scraping endpoint structure
const scrapingEndpointTemplate = {
  endpoint: "/api/ov/scrape",
  parameters: {
    mid: "6669997", // Required
    arrival_date: "2025-11-10", // Optional
    departure_date: "2025-11-15", // Optional  
    guests: "2" // Optional
  },
  response: {
    success: true,
    data: {
      hotel: {
        name: "Canareef Resort Maldives",
        mid: "mid6669997",
        location: "Addu Atoll, Maldives",
        rating: 4.5,
        description: "...",
        amenities: [],
        images: [],
        rooms: [],
        prices: {}
      }
    },
    scraped_from: "https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/",
    timestamp: new Date().toISOString()
  }
};

console.log('\n📋 Proposed Scraping Endpoint Response Structure:');
console.log(JSON.stringify(scrapingEndpointTemplate, null, 2));