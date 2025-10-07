#!/usr/bin/env node

// Direct test of Ostrovok.ru API to find hotel mid identifiers
console.log('🔍 Direct Analysis of Ostrovok.ru Search API\n');
console.log('='.repeat(50));

async function testDirectOstrovokAPI() {
  try {
    // Generate UUIDs
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const sessionId = generateUUID();
    const searchUuid = generateUUID();
    
    // Build the payload exactly like our proxy does
    const payload = {
      session_params: {
        arrival_date: '2025-11-10',
        currency: 'RUB',
        departure_date: '2025-11-15',
        language: 'en',
        paxes: [{ adults: 2 }],
        region_id: 109,
        search_uuid: searchUuid
      },
      page: 1,
      filters: { kinds: ['resort'] },
      sort: 'price_asc',
      session_id: sessionId,
      map_hotels: true
    };
    
    console.log('📡 Making direct request to Ostrovok.ru...');
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const ostrovokUrl = `https://ostrovok.ru/hotel/search/v2/site/serp?session=${sessionId}`;
    
    const response = await fetch(ostrovokUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'pragma': 'no-cache',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        'referer': `https://ostrovok.ru/hotel/maldives/?q=109&dates=10.11.2025-15.11.2025&guests=2&search=yes`,
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (!response.ok) {
      console.log('❌ Error response:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    console.log('\n🔍 Analyzing Direct API Response:');
    console.log('='.repeat(40));
    
    // Check top level structure
    console.log('📋 Top-level keys:', Object.keys(data));
    
    // Look for hotels in various possible locations
    const searchPaths = [
      'hotels',
      'results', 
      'data.hotels',
      'data.results',
      'response.hotels',
      'items',
      'properties'
    ];
    
    let foundHotels = null;
    let foundPath = '';
    
    for (const path of searchPaths) {
      let current = data;
      const parts = path.split('.');
      
      try {
        for (const part of parts) {
          current = current[part];
        }
        
        if (Array.isArray(current) && current.length > 0) {
          foundHotels = current;
          foundPath = path;
          break;
        }
      } catch (e) {
        // Path doesn't exist, continue
      }
    }
    
    if (foundHotels) {
      console.log(`\n🏨 Found hotels at: ${foundPath}`);
      console.log(`📊 Hotels count: ${foundHotels.length}`);
      
      // Examine first hotel in detail
      if (foundHotels.length > 0) {
        const firstHotel = foundHotels[0];
        console.log(`\n🔍 First Hotel Structure:`);
        console.log('📋 All keys:', Object.keys(firstHotel));
        
        // Look specifically for mid-like identifiers
        const potentialMidFields = Object.keys(firstHotel).filter(key => {
          const value = firstHotel[key];
          return (
            key.toLowerCase().includes('id') ||
            key.toLowerCase().includes('mid') ||
            (typeof value === 'string' && /^mid\d+$/.test(value)) ||
            (typeof value === 'string' && value.includes('mid')) ||
            key.toLowerCase().includes('code') ||
            key.toLowerCase().includes('uid')
          );
        });
        
        console.log('\n🔑 Potential MID fields:');
        potentialMidFields.forEach(field => {
          console.log(`   ${field}: ${firstHotel[field]} (${typeof firstHotel[field]})`);
        });
        
        // Check nested objects for mid identifiers
        Object.keys(firstHotel).forEach(key => {
          const value = firstHotel[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const nestedMids = Object.keys(value).filter(nestedKey => {
              const nestedValue = value[nestedKey];
              return (
                nestedKey.toLowerCase().includes('id') ||
                nestedKey.toLowerCase().includes('mid') ||
                (typeof nestedValue === 'string' && /^mid\d+$/.test(nestedValue))
              );
            });
            
            if (nestedMids.length > 0) {
              console.log(`\n📁 ${key} contains:`);
              nestedMids.forEach(nestedField => {
                console.log(`     ${nestedField}: ${value[nestedField]}`);
              });
            }
          }
        });
        
        // Look for URL patterns
        const urlPattern = /mid\d+/g;
        Object.keys(firstHotel).forEach(key => {
          const value = firstHotel[key];
          if (typeof value === 'string' && urlPattern.test(value)) {
            console.log(`\n🔗 Found MID pattern in ${key}:`, value);
            const matches = value.match(urlPattern);
            console.log(`   Extracted MIDs:`, matches);
          }
        });
        
        // Show sample of hotel data
        console.log(`\n📝 Sample hotel data:`);
        console.log(JSON.stringify(firstHotel, null, 2).substring(0, 1000) + '...');
      }
    } else {
      console.log('\n❌ No hotels array found in response');
      console.log('\n📝 Full response structure:');
      console.log(JSON.stringify(data, null, 2).substring(0, 2000) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  await testDirectOstrovokAPI();
  
  console.log('\n💡 Looking for:');
  console.log('- Fields containing "mid6669997" type identifiers');  
  console.log('- URL fields with embedded mid values');
  console.log('- Hotel ID or code fields that map to mid values');
}

main().catch(console.error);