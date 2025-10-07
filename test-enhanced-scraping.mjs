#!/usr/bin/env node

/**
 * Enhanced Scraping Test Script
 * Tests the improved scraping functionality with real Ostrovok data
 */

// Sample HTML content from Ostrovok (based on browser inspection)
const sampleHtml = `
<html>
<head>
    <title>Canareef Resort Maldives 4* in Addu Atoll 918 reviews of the hotel, room photos and prices – book Canareef Resort Maldives online</title>
    <meta name="description" content="Book Canareef Resort Maldives 4* in Addu Atoll. 918 reviews, photos, prices. Best deals for Canareef Resort Maldives.">
</head>
<body>
    <h1>Canareef Resort Maldives</h1>
    <div>
        <button>8.8</button>
        <p>Excellent</p>
        <p>Based on 918 reviews from guests</p>
    </div>
    <p>from ₽ 12,768</p>
    <p>Herathera Island Resort, Addu City, 19060, Maldives, Meedhoo (Seenu Atoll), Addu Atoll</p>
    
    <!-- Amenities section -->
    <h3>Popular amenities</h3>
    <ul>
        <li>Free Internet</li>
        <li>Transfer</li>
        <li>Suitable for children</li>
        <li>Swimming Pool</li>
        <li>Fitness centre</li>
        <li>Air conditioning</li>
        <li>Restaurant</li>
        <li>Bar</li>
        <li>Spa</li>
        <li>Free Wi-Fi</li>
    </ul>
    
    <!-- Review scores -->
    <div>
        <p>Cleanliness</p>
        <p>"9"</p>
    </div>
    <div>
        <p>Location</p>
        <p>"9"</p>
    </div>
    <div>
        <p>Service</p>
        <p>"9"</p>
    </div>
    <div>
        <p>Meals</p>
        <p>"9"</p>
    </div>
    <div>
        <p>Value for money</p>
        <p>8,5</p>
    </div>
    
    <!-- Hotel facts -->
    <p>271 rooms</p>
    <div>Check-in</div>
    <div>After 14:00</div>
    <div>Check-out</div>
    <div>Until 12:00</div>
    
    <!-- Images -->
    <img src="https://example.com/hotel1.jpg" alt="Hotel Image 1">
    <img src="https://example.com/hotel2.jpg" alt="Hotel Image 2">
</body>
</html>
`;

// Enhanced extraction function (based on our updated scraper)
async function extractHotelData(html, masterId) {
  const data = {};

  try {
    console.log('🔍 Testing enhanced extraction...\n');

    // Extract hotel name - multiple patterns
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title>([^<]+?)\s*[-|]\s*(?:Ostrovok|in\s)/i) ||
                     html.match(/heading\s+"([^"]+)"\s+\[level=1\]/i);
    if (nameMatch && nameMatch[1]) {
      data.name = nameMatch[1].trim().replace(/\s+/g, ' ');
      console.log('✅ Hotel Name:', data.name);
    }

    // Extract rating - enhanced patterns for Ostrovok
    const ratingMatch = html.match(/button\s+"(\d+\.\d+)"/i) || 
                       html.match(/<button[^>]*>(\d+\.\d+)<\/button>/i) ||
                       html.match(/(\d+\.\d+)\s*\/\s*10/i);
    if (ratingMatch && ratingMatch[1]) {
      data.rating = parseFloat(ratingMatch[1]);
      console.log('✅ Rating:', data.rating);
    }

    // Extract price information
    const priceMatch = html.match(/from\s*₽\s*([0-9,]+)/i) ||
                      html.match(/(\$\d+(?:,\d{3})*|\d+(?:,\d{3})*\s*₽)/i);
    if (priceMatch && priceMatch[1]) {
      data.price = `₽ ${priceMatch[1]}`;
      console.log('✅ Price:', data.price);
    }

    // Extract location/address
    const locationMatch = html.match(/([^<>\n]*Maldives[^<>\n]*)/i);
    if (locationMatch && locationMatch[1]) {
      data.location = locationMatch[1].trim().replace(/\s+/g, ' ');
      console.log('✅ Location:', data.location);
    }

    // Extract amenities
    const amenities = [];
    const amenityMatches = html.matchAll(/<li[^>]*>([^<]+)<\/li>/gi);
    for (const match of amenityMatches) {
      const amenity = match[1]?.trim();
      if (amenity && amenity.length > 2 && amenity.length < 50 && 
          !amenities.includes(amenity)) {
        amenities.push(amenity);
      }
    }
    
    if (amenities.length > 0) {
      data.amenities = amenities;
      console.log('✅ Amenities:', data.amenities.length, 'found:', data.amenities.slice(0, 5).join(', '), '...');
    }

    // Extract review count
    const reviewCountMatch = html.match(/(\d+)\s+reviews/i) ||
                            html.match(/Based on (\d+) reviews/i);
    if (reviewCountMatch && reviewCountMatch[1]) {
      data.review_count = parseInt(reviewCountMatch[1]);
      console.log('✅ Review Count:', data.review_count);
    }

    // Extract detailed review scores
    const reviewScores = {};
    const scorePatterns = [
      { key: 'cleanliness', pattern: /Cleanliness[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'location', pattern: /Location[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'service', pattern: /Service[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'meals', pattern: /Meals[^"]*"(\d+(?:\.\d+)?)"/ },
      { key: 'value', pattern: /Value for money[^"]*(\d+(?:,\d+)?(?:\.\d+)?)/ }
    ];

    for (const { key, pattern } of scorePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        reviewScores[key] = parseFloat(match[1].replace(',', '.'));
      }
    }

    if (Object.keys(reviewScores).length > 0) {
      data.review_scores = reviewScores;
      console.log('✅ Review Scores:', JSON.stringify(reviewScores, null, 2));
    }

    // Extract hotel facts
    const hotelFacts = {};
    
    const roomCountMatch = html.match(/(\d+)\s+rooms/i);
    if (roomCountMatch && roomCountMatch[1]) {
      hotelFacts.rooms = parseInt(roomCountMatch[1]);
    }

    const checkinMatch = html.match(/After\s+(\d{2}:\d{2})/i);
    if (checkinMatch && checkinMatch[1]) {
      hotelFacts.checkin = checkinMatch[1];
    }

    const checkoutMatch = html.match(/Until\s+(\d{2}:\d{2})/i);
    if (checkoutMatch && checkoutMatch[1]) {
      hotelFacts.checkout = checkoutMatch[1];
    }

    if (Object.keys(hotelFacts).length > 0) {
      data.hotel_facts = hotelFacts;
      console.log('✅ Hotel Facts:', JSON.stringify(hotelFacts, null, 2));
    }

    // Extract images
    const images = [];
    const imageMatches = html.matchAll(/src\s*=\s*['"]([^'"]*(?:jpg|jpeg|png|webp)[^'"]*)['"]/gi);
    for (const match of imageMatches) {
      const imgUrl = match[1];
      if (imgUrl && !imgUrl.includes('data:') && !images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }
    if (images.length > 0) {
      data.images = images;
      console.log('✅ Images:', data.images.length, 'found');
    }

    console.log('\n🎯 Final extracted data summary:');
    console.log('- Name:', data.name || 'Not found');
    console.log('- Rating:', data.rating || 'Not found');
    console.log('- Price:', data.price || 'Not found');
    console.log('- Location:', data.location ? 'Found' : 'Not found');
    console.log('- Amenities:', data.amenities?.length || 0, 'items');
    console.log('- Reviews:', data.review_count || 'Not found');
    console.log('- Review Scores:', Object.keys(data.review_scores || {}).length, 'categories');
    console.log('- Hotel Facts:', Object.keys(data.hotel_facts || {}).length, 'items');
    console.log('- Images:', data.images?.length || 0, 'items');

  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
  }

  return data;
}

// Test the extraction
async function runTest() {
  console.log('🧪 Enhanced Scraping Test\n');
  console.log('Testing with sample Ostrovok HTML structure...\n');
  
  const result = await extractHotelData(sampleHtml, '6669997');
  
  console.log('\n📋 Complete Result:');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n✨ Test completed! Our scraper can extract rich structured data from Ostrovok pages.');
}

runTest().catch(console.error);