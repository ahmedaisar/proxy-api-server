#!/usr/bin/env node

console.log(`
╔════════════════════════════════════════════════════════════════════╗
║           🎉 Ostrovok.ru Proxy Endpoint - Quick Reference         ║
╚════════════════════════════════════════════════════════════════════╝

📍 ENDPOINT
   POST /api/ov/search

🚀 QUICK START
   npm run dev
   node test-ostrovok.mjs

📝 MINIMAL REQUEST
   curl -X POST "http://localhost:3000/api/ov/search" \\
     -H "Content-Type: application/json" \\
     -d '{}'

🔧 FULL REQUEST
   {
     "region_id": 109,
     "arrival_date": "2025-11-10",
     "departure_date": "2025-11-15",
     "adults": 2,
     "currency": "USD",
     "language": "en",
     "page": 1,
     "kinds": ["resort"],
     "sort": "price_asc"
   }

📊 PARAMETERS (all optional)
   region_id      → 109 (Maldives), 815 (Dubai), 3645 (Bali)
   arrival_date   → YYYY-MM-DD format
   departure_date → YYYY-MM-DD format
   adults         → Number (default: 2)
   currency       → RUB, USD, EUR, etc (default: RUB)
   language       → en, ru, etc (default: en)
   page           → Page number (default: 1)
   kinds          → ["resort", "hotel", "apartment"]
   sort           → price_asc, price_desc, rating_desc

✨ FEATURES
   ✓ Auto-generated session IDs
   ✓ Rate limiting (60/min)
   ✓ CORS enabled
   ✓ Edge Runtime
   ✓ Full error handling

📚 DOCUMENTATION
   See OSTROVOK-API.md for complete docs

🧪 TEST
   node test-ostrovok.mjs

🌐 PRODUCTION
   https://your-project.vercel.app/api/ov/search

╚════════════════════════════════════════════════════════════════════╝
`);
