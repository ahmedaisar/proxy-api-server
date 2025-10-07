#!/usr/bin/env node

// Test script for /api/ov/hotel endpoint - both GET and POST methods
const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing Ostrovok Hotel Details Endpoint\n');
console.log('='.repeat(50));

// Test cases
const tests = [
  {
    name: '🔍 GET - Hotel with URL Parameters',
    type: 'GET',
    url: `${BASE_URL}/api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17&region_id=109&currency=USD&lang=en&paxes=2`
  },
  {
    name: '🔍 GET - Minimal (Hotel Only)',
    type: 'GET', 
    url: `${BASE_URL}/api/ov/hotel?hotel=reethi_faru_resort`
  },
  {
    name: '🔍 GET - Multiple Paxes',
    type: 'GET',
    url: `${BASE_URL}/api/ov/hotel?hotel=reethi_faru_resort&paxes=2,1&arrival_date=2026-01-12&departure_date=2026-01-17`
  },
  {
    name: '📤 POST - Full Hotel Details',
    type: 'POST',
    url: `${BASE_URL}/api/ov/hotel`,
    body: {
      arrival_date: '2026-01-12',
      departure_date: '2026-01-17',
      hotel: 'reethi_faru_resort',
      currency: 'USD',
      lang: 'en',
      region_id: 109,
      paxes: [{ adults: 2 }]
    }
  },
  {
    name: '📤 POST - Minimal (Hotel Only)',
    type: 'POST',
    url: `${BASE_URL}/api/ov/hotel`,
    body: {
      hotel: 'reethi_faru_resort'
    }
  },
  {
    name: '❌ GET - Missing Hotel Parameter',
    type: 'GET',
    url: `${BASE_URL}/api/ov/hotel?arrival_date=2026-01-12`,
    expectError: true
  }
];

async function runTest(test) {
  console.log(`\n${test.name}`);
  console.log('-'.repeat(test.name.length));
  
  try {
    const options = {
      method: test.type,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (test.body) {
      options.body = JSON.stringify(test.body);
    }
    
    console.log(`📡 ${test.type} ${test.url}`);
    if (test.body) {
      console.log(`📦 Body: ${JSON.stringify(test.body, null, 2)}`);
    }
    
    const response = await fetch(test.url, options);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    
    if (test.expectError && !response.ok) {
      console.log('✅ Expected error received');
      console.log(`📄 Error: ${data.error || 'Unknown error'}`);
      return { success: true, expected: true };
    } else if (!test.expectError && response.ok) {
      console.log('✅ Success response received');
      console.log(`📄 Message: ${data.message || 'No message'}`);
      if (data.metadata) {
        console.log(`🔍 Hotel: ${data.metadata.search_params?.hotel}`);
        console.log(`📅 Dates: ${data.metadata.search_params?.arrival_date} to ${data.metadata.search_params?.departure_date}`);
        console.log(`👥 Paxes: ${JSON.stringify(data.metadata.search_params?.paxes)}`);
      }
      return { success: true, expected: false };
    } else {
      console.log('❌ Unexpected response');
      console.log(`📄 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      return { success: false, expected: false };
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return { success: false, expected: false };
  }
}

async function runAllTests() {
  console.log(`🚀 Starting tests against ${BASE_URL}`);
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push({
      name: test.name,
      ...result
    });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const type = result.expected ? '(Expected Error)' : '';
    console.log(`${icon} ${result.name} ${type}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Hotel endpoint is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the endpoint implementation.');
  }
}

// Handle server not running
process.on('unhandledRejection', (reason) => {
  if (reason.code === 'ECONNREFUSED') {
    console.log('❌ Connection refused. Make sure the server is running:');
    console.log('   npm run dev');
  } else {
    console.log('❌ Unhandled error:', reason.message);
  }
  process.exit(1);
});

runAllTests().catch(console.error);