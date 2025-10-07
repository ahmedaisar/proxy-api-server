# Deployment Guide

## Pre-deployment Checklist

1. ✅ All API endpoints converted to Edge Runtime
2. ✅ Rate limiting implemented  
3. ✅ CORS headers configured
4. ✅ TypeScript configuration updated
5. ✅ Vercel configuration optimized
6. ✅ Package.json dependencies updated

## Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Vercel

```bash
npx vercel login
```

### 3. Deploy

```bash
# Deploy to production
npm run vercel:deploy

# Or using Vercel CLI directly
npx vercel --prod
```

### 4. Test Endpoints

After deployment, test your endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Search hotels
curl "https://your-project.vercel.app/api/search?adults=2&checkin=20251111&checkout=20251114"

# Hotel details (replace with actual slug)
curl "https://your-project.vercel.app/api/hotels/hotel-slug-here"
```

## Local Development

```bash
# Start local development server
npm run dev
```

The API will be available at `http://localhost:3000`

## Performance Benefits

- 🚀 **Edge Runtime**: Functions run closer to users globally
- ⚡ **Zero Cold Start**: Edge functions start instantly  
- 🔄 **Auto-scaling**: Handles traffic spikes automatically
- 📱 **Mobile Optimized**: Fast response times on mobile networks

## Monitoring

- View logs in Vercel dashboard
- Monitor performance metrics
- Set up alerts for errors or high usage
