#!/usr/bin/env node

// Test script to analyze Ostrovok search response and find hotel mid identifiers
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use node-fetch for better compatibility
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  try {
    fetch = require('node-fetch');
  } catch {
    console.log('❌ fetch not available, trying to install node-fetch...');
    const { execSync } = require('child_process');
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    fetch = require('node-fetch');
  }
}

const BASE_URL = 'https://proxy-api-server-mu.vercel.app';

console.log('🔍 Analyzing Ostrovok Search Response for Hotel MID Identifiers\n');
console.log('='.repeat(70));

async function analyzeSearchResponse() {
  try {
    console.log('📡 Making search request to find hotel identifiers...\n');
    
    // Make a search request
    const response = await fetch(`${BASE_URL}/api/ov/search?arrival_date=2025-11-10&departure_date=2025-11-15&adults=2&region_id=109&currency=USD`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('✅ Search successful:', data.success);
    
    if (!data.success || !data.data) {
      console.log('❌ No data returned from search');
      return;
    }
    
    // Examine the response structure
    console.log('\n🔍 Analyzing Response Structure:');
    console.log('='.repeat(40));
    
    // Top-level keys
    console.log('\n📋 Top-level keys in response:');
    Object.keys(data.data).forEach(key => {
      console.log(`  - ${key}: ${typeof data.data[key]}`);
    });
    
    // Look for hotels array or similar
    const possibleHotelKeys = ['hotels', 'results', 'items', 'data', 'list', 'properties'];
    let hotelsArray = null;
    let hotelKey = null;
    
    for (const key of possibleHotelKeys) {
      if (data.data[key] && Array.isArray(data.data[key])) {
        hotelsArray = data.data[key];
        hotelKey = key;
        break;
      }
    }
    
    if (!hotelsArray) {
      // Check nested structures
      console.log('\n🔍 Searching for hotels in nested structures...');
      for (const [key, value] of Object.entries(data.data)) {
        if (value && typeof value === 'object') {
          console.log(`\n📁 Checking ${key}:`);
          if (Array.isArray(value)) {
            console.log(`  Array with ${value.length} items`);
            if (value.length > 0) {
              console.log(`  First item keys:`, Object.keys(value[0]));
            }
          } else {
            console.log(`  Object keys:`, Object.keys(value));
            // Check for nested arrays
            for (const [nestedKey, nestedValue] of Object.entries(value)) {
              if (Array.isArray(nestedValue) && nestedValue.length > 0) {
                console.log(`    ${nestedKey}: Array with ${nestedValue.length} items`);
                console.log(`    First item keys:`, Object.keys(nestedValue[0] || {}));
                if (nestedKey.toLowerCase().includes('hotel') || nestedValue.length > 5) {
                  hotelsArray = nestedValue;
                  hotelKey = `${key}.${nestedKey}`;
                }
              }
            }
          }
        }
      }
    }
    
    if (hotelsArray && hotelsArray.length > 0) {
      console.log(`\n🏨 Found hotels array at: ${hotelKey}`);
      console.log(`📊 Hotels count: ${hotelsArray.length}`);
      
      // Examine first few hotels for mid identifier
      console.log('\n🔍 Examining hotel structure for MID identifiers:');
      console.log('='.repeat(50));
      
      for (let i = 0; i < Math.min(3, hotelsArray.length); i++) {
        const hotel = hotelsArray[i];
        console.log(`\n🏨 Hotel ${i + 1}:`);
        console.log(`📋 Keys:`, Object.keys(hotel));
        
        // Look for potential ID fields
        const idFields = Object.keys(hotel).filter(key => 
          key.toLowerCase().includes('id') || 
          key.toLowerCase().includes('mid') ||
          key.toLowerCase().includes('code') ||
          key.toLowerCase().includes('uid')
        );
        
        console.log(`🔑 ID-like fields:`, idFields);
        
        // Print values of ID fields
        idFields.forEach(field => {
          console.log(`   ${field}: ${hotel[field]}`);
        });
        
        // Check for nested objects that might contain IDs
        Object.keys(hotel).forEach(key => {
          if (hotel[key] && typeof hotel[key] === 'object' && !Array.isArray(hotel[key])) {
            const nestedIds = Object.keys(hotel[key]).filter(nestedKey => 
              nestedKey.toLowerCase().includes('id') || 
              nestedKey.toLowerCase().includes('mid') ||
              nestedKey.toLowerCase().includes('code')
            );
            if (nestedIds.length > 0) {
              console.log(`   ${key} contains:`, nestedIds.map(id => `${id}: ${hotel[key][id]}`));
            }
          }
        });
        
        // Look for URL-like fields
        const urlFields = Object.keys(hotel).filter(key => 
          key.toLowerCase().includes('url') || 
          key.toLowerCase().includes('link') ||
          key.toLowerCase().includes('href')
        );
        
        if (urlFields.length > 0) {
          console.log(`🔗 URL fields:`, urlFields);
          urlFields.forEach(field => {
            console.log(`   ${field}: ${hotel[field]}`);
          });
        }
      }
      
    } else {
      console.log('\n❌ Could not find hotels array in response');
      
      // Show full structure for debugging
      console.log('\n📝 Full response structure (first 1000 chars):');
      console.log(JSON.stringify(data.data, null, 2).substring(0, 1000) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing response:', error.message);
  }
}

async function main() {
  console.log(`🚀 Starting analysis against ${BASE_URL}`);
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  
  await analyzeSearchResponse();
  
  console.log('\n💡 What to look for:');
  console.log('- Hotel ID fields like "id", "hotel_id", "mid", "code"');
  console.log('- URL fields that might contain the mid identifier');
  console.log('- Any field matching pattern "mid[0-9]+"');
  console.log('\n🎯 Goal: Find how to extract "mid6669997" type identifiers');
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

main().catch(console.error);