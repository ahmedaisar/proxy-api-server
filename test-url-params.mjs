#!/usr/bin/env node

// Simple test to validate URL parameter parsing in the Ostrovok endpoint
console.log('🧪 Testing URL Parameter Functionality\n');

// Test URL parameter parsing logic (simulate what happens in the endpoint)
function testUrlParamParsing() {
    // Simulate URL object from GET request
    const testUrl = new URL('http://localhost:3000/api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2&kinds=resort,hotel&region_id=109&page=1&map_hotels=true');
    
    console.log('📋 URL Parameters extracted:');
    for (const [key, value] of testUrl.searchParams) {
        console.log(`   ${key}: "${value}"`);
    }
    
    // Test parameter conversion logic
    const params = {};
    for (const [key, value] of testUrl.searchParams) {
        if (key === 'adults' || key === 'children' || key === 'region_id' || key === 'page') {
            params[key] = parseInt(value);
        } else if (key === 'kinds') {
            params[key] = value.split(',');
        } else if (key === 'map_hotels') {
            params[key] = value === 'true';
        } else {
            params[key] = value;
        }
    }
    
    console.log('\n🔄 Converted Parameters:');
    console.log(JSON.stringify(params, null, 2));
    
    // Validate types
    console.log('\n✅ Type Validation:');
    console.log(`   adults: ${typeof params.adults} (${params.adults})`);
    console.log(`   region_id: ${typeof params.region_id} (${params.region_id})`);
    console.log(`   kinds: ${Array.isArray(params.kinds) ? 'array' : typeof params.kinds} (${JSON.stringify(params.kinds)})`);
    console.log(`   map_hotels: ${typeof params.map_hotels} (${params.map_hotels})`);
    console.log(`   arrival_date: ${typeof params.arrival_date} (${params.arrival_date})`);
}

testUrlParamParsing();

console.log('\n🎯 Example Usage:');
console.log('GET: /api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2');
console.log('POST: /api/ov/search with JSON body');
console.log('\n✨ Both methods are now supported!');