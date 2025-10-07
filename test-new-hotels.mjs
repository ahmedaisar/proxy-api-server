#!/usr/bin/env node

/**
 * Test script for the new hotels index.ts endpoint
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testHotelEndpoint(description, path, expectedStatus = 200) {
  console.log(`\n🧪 ${description}`);
  console.log(`📡 URL: ${BASE_URL}${path}`);
  
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    const data = await response.json();
    
    const statusIcon = response.status === expectedStatus ? '✅' : '❌';
    console.log(`${statusIcon} Status: ${response.status} (expected: ${expectedStatus})`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.status === expectedStatus, status: response.status, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runHotelTests() {
  console.log('🚀 Testing New Hotels Index.ts Endpoint');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Test 1: Health check
  await testHotelEndpoint('Health Check', '/api/health');
  
  console.log('\n' + '='.repeat(60));
  console.log('🏨 Hotel Details Endpoint Tests');
  console.log('='.repeat(60));
  
  // Test 2: Query parameter method (recommended)
  await testHotelEndpoint(
    'Hotel via Query Parameter (Recommended)', 
    '/api/hotels?slug=/hotels/maldives/arrival-beachspa'
  );
  
  // Test 3: Path method (fallback)  
  await testHotelEndpoint(
    'Hotel via Path (Fallback)',
    '/api/hotels/maldives/arrival-beachspa'
  );
  
  // Test 4: Full path in URL
  await testHotelEndpoint(
    'Hotel with Full Path',
    '/api/hotels?slug=%2Fhotels%2Fmaldives%2Farrival-beachspa' // URL encoded
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🚨 Error Case Tests');
  console.log('='.repeat(60));
  
  // Test 5: No slug provided
  await testHotelEndpoint(
    'No Slug Provided (Should Fail)', 
    '/api/hotels',
    400
  );
  
  // Test 6: Empty slug
  await testHotelEndpoint(
    'Empty Slug (Should Fail)',
    '/api/hotels?slug=',
    400
  );
  
  // Test 7: Invalid slug
  await testHotelEndpoint(
    'Invalid Slug (Might Fail)',
    '/api/hotels?slug=/hotels/invalid/nonexistent-hotel',
    404
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Tests completed!');
  console.log('\n📝 Usage Examples:');
  console.log('   🔸 Recommended: GET /api/hotels?slug=/hotels/maldives/arrival-beachspa');
  console.log('   🔸 Fallback:    GET /api/hotels/maldives/arrival-beachspa');
  console.log('   🔸 Production:  https://your-project.vercel.app/api/hotels?slug=/hotels/maldives/arrival-beachspa');
}

// Run tests
runHotelTests().catch(console.error);