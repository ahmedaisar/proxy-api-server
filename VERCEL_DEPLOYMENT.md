# AnexTour API Server - Vercel Deployment

This project is now configured for deployment on Vercel as serverless functions.

## 🚀 Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Install Dependencies
```bash
npm run install:vercel
```

### 3. Login to Vercel
```bash
vercel login
```

### 4. Deploy to Vercel
```bash
# Deploy for testing
vercel

# Deploy to production
npm run vercel:deploy
```

## 📚 API Endpoints (Vercel)

Once deployed, your API will be available at `https://your-project.vercel.app`:

### **Health Check**
```
GET https://your-project.vercel.app/health
```

### **Search Hotels**
```
GET https://your-project.vercel.app/api/search?adults=2&checkin=20251111&checkout=20251114
```

### **Get Hotel Details**
```
GET https://your-project.vercel.app/api/hotels/[slug]?slug=%2Fhotels%2Fmaldives%2Fwhite-harp-beach-maldives
```

## 🔧 Local Development

### Run with Bun (original)
```bash
bun run dev
```

### Run with Vercel (serverless simulation)
```bash
npm run vercel:dev
```

## 📁 Project Structure (Vercel)

```
├── api/                     # Vercel serverless functions
│   ├── health.ts           # Health check endpoint
│   ├── search.ts           # Hotel search endpoint
│   └── hotels/
│       └── [slug].ts       # Hotel details by slug
├── src/                    # Original source code (reused)
│   ├── handlers/
│   ├── middleware/
│   ├── utils/
│   └── types.ts
├── vercel.json             # Vercel configuration
└── package.json            # Updated with Vercel deps
```

## ⚡ Key Changes for Vercel

1. **Serverless Functions**: Each endpoint is now a separate file in `/api`
2. **No Server Instance**: Uses Vercel's function runtime instead of Bun.serve()
3. **Route Handling**: Vercel handles routing via file structure
4. **Environment**: Runs on Node.js runtime on Vercel

## 🔒 Features Preserved

✅ Rate limiting (60 requests/minute per IP)
✅ CORS headers
✅ Error handling
✅ Parameter mapping
✅ Hotel slug support
✅ TypeScript support