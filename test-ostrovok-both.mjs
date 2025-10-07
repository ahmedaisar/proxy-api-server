#!/usr/bin/env node

/**
 * Updated test script for Ostrovok endpoint - supports both GET and POST
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testGet(description, queryParams) {
  const url = `${BASE_URL}/api/ov/search${queryParams}`;
  console.log(`\n🔍 GET: ${description}`);
  console.log(`📡 URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    
    if (response.ok && data.success) {
      console.log(`📊 Results:`);
      console.log(`   - Session ID: ${data.metadata?.session_id?.substring(0, 8)}...`);
      console.log(`   - Search Params: ${JSON.stringify(data.metadata?.search_params)}`);
      console.log(`   - Hotels found: ${data.data?.hotels?.length || 0}`);
    } else {
      console.log(`❌ Error:`, data.error);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testPost(description, payload) {
  console.log(`\n📤 POST: ${description}`);
  console.log(`📡 URL: ${BASE_URL}/api/ov/search`);
  console.log(`📦 Payload: ${JSON.stringify(payload)}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    
    if (response.ok && data.success) {
      console.log(`📊 Results:`);
      console.log(`   - Session ID: ${data.metadata?.session_id?.substring(0, 8)}...`);
      console.log(`   - Search Params: ${JSON.stringify(data.metadata?.search_params)}`);
      console.log(`   - Hotels found: ${data.data?.hotels?.length || 0}`);
    } else {
      console.log(`❌ Error:`, data.error);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Ostrovok API - GET & POST Methods');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('='.repeat(80));
  
  // GET Method Tests
  console.log('\n📍 GET METHOD TESTS');
  console.log('='.repeat(80));
  
  await testGet(
    'Simple GET with basic params',
    '?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2'
  );
  
  await testGet(
    'GET with all parameters',
    '?region_id=109&arrival_date=2025-12-01&departure_date=2025-12-07&adults=4&currency=USD&language=en&page=1&kinds=resort,hotel&sort=rating_desc&map_hotels=true'
  );
  
  await testGet(
    'GET with minimal params (most defaults)',
    '?adults=1&currency=EUR'
  );
  
  await testGet(
    'GET with no parameters (all defaults)',
    ''
  );
  
  // POST Method Tests
  console.log('\n📍 POST METHOD TESTS');
  console.log('='.repeat(80));
  
  await testPost('POST with basic params', {
    arrival_date: '2025-11-20',
    departure_date: '2025-11-25',
    adults: 2
  });
  
  await testPost('POST with full params', {
    region_id: 815, // Dubai
    arrival_date: '2025-12-15',
    departure_date: '2025-12-22',
    adults: 3,
    currency: 'USD',
    language: 'en',
    page: 1,
    kinds: ['resort'],
    sort: 'price_asc',
    map_hotels: true
  });
  
  await testPost('POST with empty body (all defaults)', {});
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ Tests completed!');
  console.log('\n📋 Summary:');
  console.log('   🔸 GET Method: Use URL parameters for simple requests');
  console.log('   🔸 POST Method: Use JSON body for complex requests');
  console.log('\n💡 Examples:');
  console.log('   GET  /api/ov/search?arrival_date=2025-11-20&adults=2');
  console.log('   POST /api/ov/search with JSON body');
  console.log('\n🔗 Available Parameters:');
  console.log('   region_id, arrival_date, departure_date, adults, currency,');
  console.log('   language, page, kinds, sort, map_hotels');
}

runTests().catch(console.error);