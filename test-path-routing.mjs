#!/usr/bin/env node

/**
 * Test script to verify Method 2 path-based routing works correctly
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testPathMapping(description, inputPath, expectedSlug) {
  console.log(`\n🧪 ${description}`);
  console.log(`📡 Input: ${BASE_URL}${inputPath}`);
  console.log(`🎯 Expected slug: "${expectedSlug}"`);
  
  try {
    const response = await fetch(`${BASE_URL}${inputPath}`);
    const data = await response.json();
    
    const actualSlug = data.slug || 'NOT_FOUND';
    const slugMatch = actualSlug === expectedSlug;
    
    console.log(`📄 Status: ${response.status}`);
    console.log(`🔍 Actual slug: "${actualSlug}"`);
    console.log(`${slugMatch ? '✅' : '❌'} Slug match: ${slugMatch}`);
    
    if (!slugMatch) {
      console.log(`❌ MISMATCH! Expected: "${expectedSlug}", Got: "${actualSlug}"`);
    }
    
    return { success: slugMatch && response.ok, status: response.status, data, actualSlug };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runPathTests() {
  console.log('🚀 Testing Method 2: Path-based Routing');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('='.repeat(80));
  
  // Test cases for Method 2 (path-based)
  const testCases = [
    {
      description: 'Simple hotel path',
      input: '/api/hotels/maldives/arrival-beachspa',
      expected: '/hotels/maldives/arrival-beachspa'
    },
    {
      description: 'Complex hotel path with multiple segments',
      input: '/api/hotels/turkey/antalya/luxury-resort-spa',
      expected: '/hotels/turkey/antalya/luxury-resort-spa'
    },
    {
      description: 'Single segment hotel path',
      input: '/api/hotels/simple-hotel',
      expected: '/hotels/simple-hotel'
    },
    {
      description: 'Hotel path with hyphens and numbers',
      input: '/api/hotels/dubai/hotel-123-deluxe',
      expected: '/hotels/dubai/hotel-123-deluxe'
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const result = await testPathMapping(
      testCase.description,
      testCase.input,
      testCase.expected
    );
    
    if (result.success) {
      passedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All path-based routing tests PASSED!');
  } else {
    console.log('❌ Some tests FAILED - check the logic above');
  }
  
  // Also test Method 1 for comparison
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Testing Method 1 (Query Parameter) for comparison:');
  
  await testPathMapping(
    'Query parameter method',
    '/api/hotels?slug=/hotels/maldives/arrival-beachspa',
    '/hotels/maldives/arrival-beachspa'
  );
  
  console.log('\n📝 Usage Summary:');
  console.log('   Method 1 (Query): GET /api/hotels?slug=/hotels/maldives/arrival-beachspa');
  console.log('   Method 2 (Path):  GET /api/hotels/maldives/arrival-beachspa');
  console.log('   Both should result in: slug = "/hotels/maldives/arrival-beachspa"');
}

// Run the tests
runPathTests().catch(console.error);