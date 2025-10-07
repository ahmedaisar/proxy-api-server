#!/usr/bin/env node

/**
 * Simple test script for hotel details endpoint
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📡 URL: ${BASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Hotel Details API Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Test 1: Health check
  await testEndpoint('/api/health', 'Health Check');
  
  // Test 2: Search for hotels to get valid slugs
  console.log('\n' + '='.repeat(50));
  const searchResult = await testEndpoint(
    '/api/search?adults=2&checkin=20251111&checkout=20251114&state=176', 
    'Hotel Search (to get slugs)'
  );
  
  // Test 3: Hotel details with a test slug
  console.log('\n' + '='.repeat(50));
  await testEndpoint('/api/hotels/test-hotel-slug', 'Hotel Details - Test Slug');
  
  // Test 4: Hotel details with empty slug (should fail)
  console.log('\n' + '='.repeat(50));
  await testEndpoint('/api/hotels/', 'Hotel Details - Empty Slug');
  
  // Test 5: Hotel details with special characters
  console.log('\n' + '='.repeat(50));
  await testEndpoint('/api/hotels/hotel%2Fwith%2Fslashes', 'Hotel Details - Special Characters');
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Tests completed!');
  console.log('\n📝 Notes:');
  console.log('   • Use actual hotel slugs from search results for real testing');
  console.log('   • Check rate limiting after 60 requests');
  console.log('   • Test both local and production environments');
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };