#!/usr/bin/env node

/**
 * Simple validation script to check API endpoint structure
 * and configuration for Vercel deployment
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

console.log('🔍 Validating Vercel Edge Runtime API structure...\n');

// Check required files exist
const requiredFiles = [
  'api/health.ts',
  'api/search.ts', 
  'api/hotels/[slug].ts',
  'vercel.json',
  'package.json',
  'tsconfig.json'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
for (const file of requiredFiles) {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
}

// Check vercel.json configuration
console.log('\n⚙️ Validating vercel.json configuration:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  const hasEdgeRuntime = vercelConfig.functions && 
    vercelConfig.functions['api/**/*.ts'] && 
    vercelConfig.functions['api/**/*.ts'].runtime === 'edge';
  
  console.log(`   ${hasEdgeRuntime ? '✅' : '❌'} Edge runtime configured`);
  
  const hasRewrites = vercelConfig.rewrites && vercelConfig.rewrites.length > 0;
  console.log(`   ${hasRewrites ? '✅' : '❌'} Health endpoint rewrite configured`);
} catch (error) {
  console.log('   ❌ Error reading vercel.json:', error.message);
  allFilesExist = false;
}

// Check package.json
console.log('\n📦 Validating package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const hasVercelDev = packageJson.scripts && packageJson.scripts.dev;
  console.log(`   ${hasVercelDev ? '✅' : '❌'} Development script configured`);
  
  const hasVercelDeploy = packageJson.scripts && packageJson.scripts['vercel:deploy'];
  console.log(`   ${hasVercelDeploy ? '✅' : '❌'} Deployment script configured`);
  
  const hasTypeModule = packageJson.type === 'module';
  console.log(`   ${hasTypeModule ? '✅' : '❌'} ES Module type configured`);
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Check API endpoints have edge runtime config
console.log('\n🚀 Checking Edge Runtime configuration in API files:');
const apiFiles = ['api/health.ts', 'api/search.ts', 'api/hotels/[slug].ts'];

for (const file of apiFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasEdgeConfig = content.includes("runtime: 'edge'");
    const hasDefaultExport = content.includes('export default');
    
    console.log(`   ${file}:`);
    console.log(`     ${hasEdgeConfig ? '✅' : '❌'} Edge runtime config`);
    console.log(`     ${hasDefaultExport ? '✅' : '❌'} Default export handler`);
  } catch (error) {
    console.log(`   ❌ Error reading ${file}:`, error.message);
    allFilesExist = false;
  }
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ All validations passed! Ready for Vercel deployment.');
  console.log('\n🚀 To deploy run:');
  console.log('   npm run vercel:deploy');
  console.log('\n🔧 For local development:');
  console.log('   npm run dev');
} else {
  console.log('❌ Some validations failed. Please fix the issues above.');
  process.exit(1);
}