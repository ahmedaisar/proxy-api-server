#!/usr/bin/env node

/**
 * Test script for Ostrovok.ru hotel search proxy endpoint
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testOstrovokSearch(description, payload) {
  console.log(`\n🧪 ${description}`);
  console.log(`📡 URL: ${BASE_URL}/api/ov/search`);
  console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/ov/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    
    if (response.ok && data.success) {
      console.log(`📊 Results:`);
      console.log(`   - Session ID: ${data.metadata?.session_id}`);
      console.log(`   - Search UUID: ${data.metadata?.search_uuid}`);
      console.log(`   - Hotels found: ${data.data?.hotels?.length || 0}`);
      console.log(`   - Total results: ${data.data?.total || 0}`);
    } else {
      console.log(`❌ Error:`, data.error);
      if (data.details) {
        console.log(`   Details:`, JSON.stringify(data.details, null, 2));
      }
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runOstrovokTests() {
  console.log('🚀 Starting Ostrovok API Proxy Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('='.repeat(70));
  
  // Test 1: Basic search with defaults
  await testOstrovokSearch('Test 1: Basic Search (Maldives)', {
    region_id: 109,
    arrival_date: '2025-11-10',
    departure_date: '2025-11-15',
    adults: 2
  });
  
  console.log('\n' + '='.repeat(70));
  
  // Test 2: Search with custom parameters
  await testOstrovokSearch('Test 2: Custom Parameters', {
    region_id: 109,
    arrival_date: '2025-12-20',
    departure_date: '2025-12-27',
    adults: 4,
    currency: 'USD',
    language: 'en',
    page: 1,
    kinds: ['resort', 'hotel'],
    sort: 'rating_desc'
  });
  
  console.log('\n' + '='.repeat(70));
  
  // Test 3: Minimal request (use all defaults)
  await testOstrovokSearch('Test 3: Minimal Request (All Defaults)', {});
  
  console.log('\n' + '='.repeat(70));
  
  // Test 4: Different region (Dubai)
  await testOstrovokSearch('Test 4: Different Region (Dubai - 815)', {
    region_id: 815,
    arrival_date: '2025-11-20',
    departure_date: '2025-11-25',
    adults: 2
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('✨ Tests completed!');
  console.log('\n📝 API Documentation:');
  console.log('   Endpoint: POST /api/ov/search');
  console.log('   Parameters:');
  console.log('     - region_id: Region ID (default: 109 - Maldives)');
  console.log('     - arrival_date: Check-in date YYYY-MM-DD (default: 2025-11-10)');
  console.log('     - departure_date: Check-out date YYYY-MM-DD (default: 2025-11-15)');
  console.log('     - adults: Number of adults (default: 2)');
  console.log('     - currency: Currency code (default: RUB)');
  console.log('     - language: Language code (default: en)');
  console.log('     - page: Page number (default: 1)');
  console.log('     - kinds: Array of hotel types (default: ["resort"])');
  console.log('     - sort: Sort order (default: price_asc)');
  console.log('     - map_hotels: Include map data (default: true)');
}

// Run tests
runOstrovokTests().catch(console.error);