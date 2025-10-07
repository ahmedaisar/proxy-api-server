#!/usr/bin/env node

// Test script for the updated scraping endpoint with complete URL structure
console.log('🔍 Testing Updated Hotel Scraping Endpoint\n');
console.log('='.repeat(60));

async function testUpdatedScrapeEndpoint() {
  const BASE_URL = 'https://proxy-api-server-mu.vercel.app';
  
  // Test Case 1: Using complete URL parameter (GET)
  console.log('🏨 Test Case 1: Complete URL Parameter (GET)');
  console.log('   Method: GET with url parameter');
  
  const completeUrl = 'https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/';
  console.log(`   URL: ${completeUrl}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape?url=${encodeURIComponent(completeUrl)}`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    
    if (data.success) {
      console.log(`   Hotel Name: ${data.data.hotel.name || 'Not found'}`);
      console.log(`   Rating: ${data.data.hotel.rating || 'Not found'}`);
      console.log(`   Source URL: ${data.data.source_url}`);
    } else {
      console.log(`   Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(60));
  
  // Test Case 2: Individual parameters (GET)
  console.log('\n🏨 Test Case 2: Individual Parameters (GET)');
  console.log('   Method: GET with master_id, ota_hotel_id, region_slug');
  
  const params = new URLSearchParams({
    master_id: '6669997',
    ota_hotel_id: 'canareef_resort_maldives',
    region_slug: 'maldives/addu_atoll'
  });
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape?${params}`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Constructed URL: ${data.data?.source_url || 'N/A'}`);
    
    if (data.success) {
      console.log(`   Hotel Name: ${data.data.hotel.name || 'Not found'}`);
    } else {
      console.log(`   Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(60));
  
  // Test Case 3: Hotel object (POST)
  console.log('\n🏨 Test Case 3: Hotel Object (POST)');
  console.log('   Method: POST with complete hotel object from search results');
  
  const hotelObject = {
    hotel: {
      master_id: 6669997,
      ota_hotel_id: "canareef_resort_maldives",
      static_vm: {
        region_catalog_slug: "maldives/addu_atoll"
      }
    }
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hotelObject)
    });
    
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Constructed URL: ${data.data?.source_url || 'N/A'}`);
    
    if (data.success) {
      console.log(`   Hotel Name: ${data.data.hotel.name || 'Not found'}`);
      console.log(`   Images Found: ${data.data.hotel.images?.length || 0}`);
      console.log(`   Amenities Found: ${data.data.hotel.amenities?.length || 0}`);
    } else {
      console.log(`   Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(60));
  
  // Test Case 4: Missing parameters (GET)
  console.log('\n🚫 Test Case 4: Missing Parameters (GET)');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape?master_id=6669997`); // Missing other params
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Error: ${data.error}`);
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 Complete Scraping Workflow:');
  console.log('\n1️⃣ Get Search Results:');
  console.log('   GET /api/ov/search?region_id=109&arrival_date=2025-11-10&departure_date=2025-11-15');
  
  console.log('\n2️⃣ Extract Hotel Data:');
  console.log('   const hotel = searchResults.data.hotels[0];');
  console.log('   const { master_id, ota_hotel_id, static_vm } = hotel;');
  
  console.log('\n3️⃣ Scrape Hotel Details (Choose one method):');
  console.log('\n   Method A - POST with hotel object:');
  console.log('   POST /api/ov/scrape');
  console.log('   Body: { hotel: hotel }');
  
  console.log('\n   Method B - GET with parameters:');
  console.log('   GET /api/ov/scrape?master_id=6669997&ota_hotel_id=canareef_resort_maldives&region_slug=maldives/addu_atoll');
  
  console.log('\n   Method C - Direct URL:');
  console.log('   GET /api/ov/scrape?url=https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/');
  
  console.log('\n4️⃣ Get Structured Data:');
  console.log('   → Hotel name, rating, images, amenities, location, etc.');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  console.log('🔄 Installing fetch polyfill...');
  try {
    const { default: fetch } = await import('node-fetch');
    globalThis.fetch = fetch;
  } catch (e) {
    console.log('❌ Could not load fetch. Please install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

testUpdatedScrapeEndpoint().catch(console.error);