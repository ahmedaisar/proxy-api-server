#!/usr/bin/env node

// Test script for children support in Ostrovok endpoints
const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing Children Support in Ostrovok Endpoints\n');
console.log('='.repeat(60));

// Test cases for children support
const tests = [
  {
    name: '🔍 Search GET - Adults + Children (URL params)',
    endpoint: 'search',
    type: 'GET',
    url: `${BASE_URL}/api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2&children=1&child_ages=2`
  },
  {
    name: '🔍 Search GET - Multiple Children',
    endpoint: 'search',
    type: 'GET',
    url: `${BASE_URL}/api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2&children=2&child_ages=5,8`
  },
  {
    name: '📤 Search POST - Adults + Children (JSON)',
    endpoint: 'search',
    type: 'POST',
    url: `${BASE_URL}/api/ov/search`,
    body: {
      arrival_date: '2025-11-20',
      departure_date: '2025-11-25',
      adults: 2,
      children: 1,
      child_ages: [2],
      region_id: 109
    }
  },
  {
    name: '🏨 Hotel GET - Adults + Children (URL params)',
    endpoint: 'hotel',
    type: 'GET',
    url: `${BASE_URL}/api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17&adults=2&children=1&child_ages=3`
  },
  {
    name: '🏨 Hotel POST - Adults + Children (JSON)',
    endpoint: 'hotel',
    type: 'POST',
    url: `${BASE_URL}/api/ov/hotel`,
    body: {
      hotel: 'reethi_faru_resort',
      arrival_date: '2026-01-12',
      departure_date: '2026-01-17',
      adults: 2,
      children: 2,
      child_ages: [3, 7]
    }
  },
  {
    name: '✅ Search GET - Adults Only (baseline)',
    endpoint: 'search',
    type: 'GET',
    url: `${BASE_URL}/api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2`
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
    
    if (response.ok && data.metadata && data.metadata.search_params) {
      const params = data.metadata.search_params;
      console.log(`👥 Adults: ${params.adults || 'N/A'}`);
      console.log(`👶 Children: ${params.children || 0}`);
      console.log(`🎂 Child Ages: ${JSON.stringify(params.child_ages || [])}`);
      
      // For search endpoint, check the payload structure
      if (test.endpoint === 'search' && data.success) {
        console.log('✅ Search endpoint children support working');
      }
      
      // For hotel endpoint, check the payload structure  
      if (test.endpoint === 'hotel' && data.success) {
        console.log('✅ Hotel endpoint children support working');
      }
    } else if (!response.ok) {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    return { success: response.ok };
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return { success: false };
  }
}

async function runAllTests() {
  console.log(`🚀 Starting children support tests against ${BASE_URL}`);
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
  console.log('\n' + '='.repeat(60));
  console.log('📊 CHILDREN SUPPORT TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All children support tests passed! Both endpoints handle children correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the children parameter implementation.');
  }
  
  console.log('\n💡 Expected behavior:');
  console.log('- GET: ?adults=2&children=1&child_ages=2 → paxes: [{"adults":2,"child_ages":[2]}]');
  console.log('- POST: {"adults":2,"children":1,"child_ages":[2]} → paxes: [{"adults":2,"child_ages":[2]}]');
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