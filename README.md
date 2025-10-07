# Hotel API Proxy Server

A high-performance API proxy server built for Vercel Edge Runtime, providing hotel search and details functionality for multiple hotel booking APIs.

## ✨ Features

- 🚀 **Edge Runtime**: Deployed on Vercel Edge for global performance
- 🔒 **Rate Limiting**: 60 requests per minute per IP address
- 🌐 **CORS Enabled**: Full cross-origin request support
- 📱 **TypeScript**: Full type safety and IntelliSense
- ⚡ **Serverless**: Auto-scaling with zero cold starts on Edge Runtime
- 🏨 **Multi-API Support**: AnexTour and Ostrovok.ru integration
- 🔍 **Web Scraping**: Rich hotel data extraction from Ostrovok pages

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- Vercel CLI
- TypeScript

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmedaisar/proxy-api-server.git
cd proxy-api-server

# Install dependencies
npm install

# Install Vercel CLI (if not already installed)
npm install -g vercel
```

### Local Development

```bash
# Start local development server
npm run dev
# or
vercel dev
```

Your API will be available at `http://localhost:3000`

### Deployment

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
npm run vercel:deploy
# or
vercel --prod
```

## 📚 API Endpoints

### 1. Health Check

```http
GET /api/health
```

Returns API health status and version information.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-07T12:00:00.000Z",
    "version": "1.0.0",
    "environment": "vercel-edge"
  },
  "message": "API is healthy"
}
```

---

### 2. AnexTour Hotel Search

```http
GET /api/search?adults=2&checkin=20251111&checkout=20251114&state=176
```

Search hotels using the AnexTour API.

**Query Parameters:**

- `adults` - Number of adults (default: 2)
- `children` - Number of children (default: 0)
- `checkin` - Check-in date in YYYYMMDD format
- `checkout` - Check-out date in YYYYMMDD format
- `state` - Destination state ID
- `nightmin` - Minimum nights (default: 7)
- `nightmax` - Maximum nights (default: 7)
- `currency` - Currency ID (default: 1)

---

### 3. AnexTour Hotel Details

```http
GET /api/hotels?slug=/hotels/maldives/arrival-beachspa
```

Get detailed information for a specific hotel using its slug from search results.

**Query Parameters:**

- `slug` - Hotel slug from search results

---

### 4. Ostrovok Hotel Search

```http
GET /api/ov/search?region_id=109&arrival_date=2025-11-10&departure_date=2025-11-15&adults=2
POST /api/ov/search
```

Search hotels via Ostrovok.ru API with flexible parameter support.

**GET Query Parameters / POST Body:**

- `region_id` - Destination region ID (default: 109)
- `arrival_date` - Check-in date YYYY-MM-DD (default: 2025-11-10)
- `departure_date` - Check-out date YYYY-MM-DD (default: 2025-11-15)
- `adults` - Number of adults (default: 2)
- `children` - Number of children (default: 0)
- `child_ages` - Array of child ages (e.g., [5,8])
- `currency` - Currency code (default: RUB)
- `language` - Language code (default: en)
- `page` - Page number (default: 1)
- `kinds` - Hotel types array (default: ["resort"])
- `sort` - Sort order (default: price_asc)
- `map_hotels` - Include map data (default: true)

**POST Request Body Example:**
```json
{
  "region_id": 109,
  "arrival_date": "2025-11-10",
  "departure_date": "2025-11-15",
  "adults": 2,
  "children": 1,
  "child_ages": [8],
  "currency": "USD",
  "page": 1,
  "sort": "price_asc"
}
```

---

### 5. Ostrovok Hotel Details

```http
GET /api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17
POST /api/ov/hotel
```

Get detailed hotel information from Ostrovok API with pricing and availability.

**GET Query Parameters / POST Body:**

- `hotel` - Hotel identifier (required)
- `arrival_date` - Check-in date YYYY-MM-DD (required)
- `departure_date` - Check-out date YYYY-MM-DD (required)
- `adults` - Number of adults (default: 2)
- `children` - Number of children (default: 0)
- `child_ages` - Array of child ages
- `currency` - Currency code (default: RUB)

---

### 6. Ostrovok Hotel Scraper

```http
GET /api/ov/scrape?master_id=6669997&ota_hotel_id=canareef_resort_maldives&region_slug=maldives/addu_atoll
```

Scrape detailed hotel information directly from Ostrovok hotel pages.

**Query Parameters:**

- `master_id` - Hotel master ID (required)
- `ota_hotel_id` - OTA hotel identifier (required)  
- `region_slug` - Region slug path (required)

**Response includes:**
- Hotel name, rating, and reviews
- Detailed descriptions and amenities
- Image galleries
- Policy information
- Location details
- Contact information

## 🏗️ Project Structure

```
├── api/                     # Vercel Edge Functions
│   ├── health.ts           # Health check endpoint
│   ├── search.ts           # AnexTour hotel search
│   ├── hotels/
│   │   └── index.ts        # AnexTour hotel details
│   └── ov/
│       └── search.ts       # Ostrovok hotel search
├── src/                    # Shared utilities
│   ├── middleware/
│   │   └── rateLimiter.ts  # Rate limiting middleware
│   └── types.ts           # TypeScript definitions
├── vercel.json             # Vercel configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
`

## ⚙️ Configuration

### Environment Variables (Optional)

Create a `.env.local` file for local development:

```env
# Add any environment variables here if needed
```

### Vercel Configuration

The `vercel.json` file configures:

- Edge Runtime for all API functions
- Route rewrites for health endpoint
- Automatic TypeScript compilation

## 🔧 Development Scripts

```bash
# Local development
npm run dev

# Type checking
npm run build

# Deploy to Vercel
npm run vercel:deploy
```

## 🔒 Rate Limiting

- **Limit**: 60 requests per minute per IP address
- **Window**: 60 seconds sliding window
- **Response**: HTTP 429 with retry information

## 🌐 CORS Policy

All endpoints support:

- **Origins**: `*` (all origins)
- **Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Headers**: `*` (all headers)

## 📱 Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* API response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Error Response

```json
{
  "error": "Error description",
  "details": { /* Additional error context */ },
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

## 🚀 Deployment URL

Once deployed, your API will be available at:

`
https://your-project-name.vercel.app
`

## 📖 API Documentation

- **Base URL**: `https://your-project.vercel.app`
- **Content-Type**: `application/json`
- **Rate Limit**: 60 requests/minute per IP

## 🛠️ Tech Stack

- **Runtime**: Vercel Edge Runtime (Web API based)
- **Language**: TypeScript
- **Deployment**: Vercel
- **Architecture**: Serverless Functions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
