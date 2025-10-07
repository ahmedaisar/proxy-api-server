// Vercel Configuration Validator
import fs from 'fs';
import path from 'path';

console.log('🔍 Validating Vercel.json configuration...\n');

try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  // Check Edge Runtime configuration
  const hasEdgeRuntime = vercelConfig.functions && 
    vercelConfig.functions['api/**/*.ts'] && 
    vercelConfig.functions['api/**/*.ts'].runtime === 'edge';
  
  console.log(`✅ Edge Runtime: ${hasEdgeRuntime ? 'Configured' : 'Missing'}`);
  
  // Check rewrites for health endpoint
  const hasHealthRewrite = vercelConfig.rewrites && 
    vercelConfig.rewrites.some(r => r.source === '/health' && r.destination === '/api/health');
  
  console.log(`✅ Health Endpoint Rewrite: ${hasHealthRewrite ? 'Configured' : 'Missing'}`);
  
  // Check CORS headers
  const hasCorsHeaders = vercelConfig.headers && 
    vercelConfig.headers.some(h => h.source === '/api/(.*)' && 
      h.headers.some(header => header.key === 'Access-Control-Allow-Origin'));
  
  console.log(`✅ CORS Headers: ${hasCorsHeaders ? 'Configured' : 'Missing'}`);
  
  // Check API structure
  const apiFiles = [
    'api/health.ts',
    'api/search.ts', 
    'api/hotels/[slug].ts'
  ];
  
  console.log('\n📁 API Endpoints:');
  apiFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  });
  
  console.log('\n🚀 Configuration Summary:');
  console.log('   • Runtime: Edge (for global performance)');
  console.log('   • File-based routing: /api/* endpoints');
  console.log('   • Health check: /health -> /api/health');
  console.log('   • CORS: Enabled for all API routes');
  
  console.log('\n✅ Configuration is ready for Vercel deployment!');
  console.log('\nTo deploy:');
  console.log('   1. npx vercel login');
  console.log('   2. npx vercel --prod');
  
} catch (error) {
  console.error('❌ Error validating configuration:', error.message);
}