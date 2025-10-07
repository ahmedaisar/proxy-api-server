#!/usr/bin/env node

// Test script for the new scraping endpoint
console.log('🔍 Testing Hotel Scraping Endpoint\n');
console.log('='.repeat(50));

async function testScrapeEndpoint() {
  const BASE_URL = 'https://proxy-api-server-mu.vercel.app';
  
  // Test case 1: Canareef Resort Maldives (master_id: 6669997)
  console.log('🏨 Test Case 1: Canareef Resort Maldives');
  console.log('   master_id: 6669997');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape?master_id=6669997`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    
    if (data.success) {
      console.log(`   Hotel Name: ${data.data.hotel.name || 'Not found'}`);
      console.log(`   Rating: ${data.data.hotel.rating || 'Not found'}`);
      console.log(`   Location: ${data.data.hotel.location || 'Not found'}`);
      console.log(`   Images: ${data.data.hotel.images?.length || 0} found`);
      console.log(`   Amenities: ${data.data.hotel.amenities?.length || 0} found`);
      console.log(`   Source URL: ${data.data.source_url}`);
    } else {
      console.log(`   Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(50));
  
  // Test case 2: Invalid master_id
  console.log('\n🚫 Test Case 2: Invalid master_id');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape?master_id=invalid`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Error: ${data.error}`);
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '-'.repeat(50));
  
  // Test case 3: Missing master_id
  console.log('\n🚫 Test Case 3: Missing master_id');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/scrape`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Error: ${data.error}`);
    
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🎯 How to use the scraping endpoint:');
  console.log('   1. Get hotel search results from /api/ov/search');
  console.log('   2. Extract master_id from any hotel in results');
  console.log('   3. Call /api/ov/scrape?master_id={master_id}');
  console.log('   4. Receive structured hotel data from Ostrovok');
  
  console.log('\n📋 Example workflow:');
  console.log('   GET /api/ov/search?region_id=109&arrival_date=2025-11-10&departure_date=2025-11-15');
  console.log('   → Extract: hotels[0].master_id = 6669997');
  console.log('   GET /api/ov/scrape?master_id=6669997');
  console.log('   → Get: Detailed hotel info with images, amenities, etc.');
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  console.log('🔄 Installing fetch polyfill...');
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
}

testScrapeEndpoint().catch(console.error);