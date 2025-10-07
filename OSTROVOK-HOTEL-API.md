# Ostrovok.ru Hotel Details API Proxy

## 🎯 Endpoint

**URL**: `GET|POST /api/ov/hotel`  
**Methods**: `GET` (URL params) or `POST` (JSON body)  
**Runtime**: Edge  
**Rate Limit**: 60 requests per minute per IP

## 📝 Description

Proxy endpoint for Ostrovok.ru hotel details API. Fetches detailed information about a specific hotel including room rates, availability, and property details. Supports both GET requests with URL parameters (simple) and POST requests with JSON body (complex).

## 🔧 Request Parameters

All parameters except `hotel` are optional. The endpoint uses sensible defaults if not provided.

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `hotel` | string | - | ✅ | Hotel identifier/slug (e.g., "reethi_faru_resort") |
| `arrival_date` | string | Tomorrow | ❌ | Check-in date (YYYY-MM-DD) |
| `departure_date` | string | +5 days from arrival | ❌ | Check-out date (YYYY-MM-DD) |
| `region_id` | number | `109` | ❌ | Region ID (109 = Maldives) |
| `currency` | string | `USD` | ❌ | Currency code (USD, EUR, RUB, etc.) |
| `lang` | string | `en` | ❌ | Language code (en, ru, etc.) |
| `paxes` | array | `[{adults:2}]` | ❌ | Guest configuration per room |
| `search_uuid` | string | Auto-generated | ❌ | Search session identifier |

### 👥 Paxes Format

For **GET** requests, use comma-separated adult counts:

- `paxes=2` → One room with 2 adults
- `paxes=2,1` → Two rooms: first with 2 adults, second with 1 adult

For **POST** requests, use array format:

```json
"paxes": [
  {"adults": 2, "children": 0},
  {"adults": 1, "children": 1}
]
```

## 📤 Request Examples

### 🔍 GET Method (URL Parameters) - SIMPLE

**Basic Request:**

```bash
curl "http://localhost:3000/api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17"
```

**Full Request:**

```bash
curl "http://localhost:3000/api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17&region_id=109&currency=USD&lang=en&paxes=2,1"
```

**Minimal Request (Hotel Only):**

```bash
curl "http://localhost:3000/api/ov/hotel?hotel=reethi_faru_resort"
```

### 📤 POST Method (JSON Body) - COMPLEX

**Full Request with Custom Parameters:**

```bash
curl -X POST "http://localhost:3000/api/ov/hotel" \
  -H "Content-Type: application/json" \
  -d '{
    "hotel": "reethi_faru_resort",
    "arrival_date": "2026-01-12",
    "departure_date": "2026-01-17",
    "region_id": 109,
    "currency": "USD",
    "lang": "en",
    "paxes": [
      {"adults": 2, "children": 0}
    ]
  }'
```

**Minimal POST (Hotel Only):**

```bash
curl -X POST "http://localhost:3000/api/ov/hotel" \
  -H "Content-Type: application/json" \
  -d '{
    "hotel": "reethi_faru_resort"
  }'
```

### JavaScript/Fetch Example

```javascript
// GET Method - Simple
const getHotelDetails = async (hotelSlug, dates = {}) => {
  const params = new URLSearchParams({
    hotel: hotelSlug,
    ...dates
  });
  
  const response = await fetch(`/api/ov/hotel?${params}`);
  return await response.json();
};

// Usage
const hotel = await getHotelDetails('reethi_faru_resort', {
  arrival_date: '2026-01-12',
  departure_date: '2026-01-17',
  paxes: '2,1' // 2 adults in room 1, 1 adult in room 2
});

// POST Method - Complex
const getHotelDetailsPost = async (params) => {
  const response = await fetch('/api/ov/hotel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      hotel: 'reethi_faru_resort',
      arrival_date: '2026-01-12',
      departure_date: '2026-01-17',
      currency: 'USD',
      paxes: [
        { adults: 2, children: 0 },
        { adults: 1, children: 1 }
      ],
      ...params
    })
  });
  
  return await response.json();
};
```

## 📥 Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "hotel": {
      "id": "reethi_faru_resort",
      "name": "Reethi Faru Resort",
      "location": {...},
      "amenities": [...],
      "rooms": [
        {
          "type": "Water Villa",
          "rates": [...],
          "availability": true
        }
      ]
    },
    "availability": {...},
    "rates": {...}
  },
  "metadata": {
    "session_id": "generated-uuid",
    "search_uuid": "generated-uuid", 
    "search_params": {
      "hotel": "reethi_faru_resort",
      "arrival_date": "2026-01-12",
      "departure_date": "2026-01-17",
      "region_id": 109,
      "currency": "USD",
      "paxes": [{"adults": 2}]
    }
  },
  "message": "Hotel details fetched successfully from Ostrovok",
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

### Error Response (4xx/5xx)

```json
{
  "error": "Missing required parameter: hotel",
  "details": {
    "originalError": "Detailed error message"
  },
  "timestamp": "2026-01-07T12:00:00.000Z"
}
```

## 🏨 Popular Hotel Identifiers

| Hotel | Identifier | Region |
|-------|------------|---------|
| Reethi Faru Resort | `reethi_faru_resort` | Maldives |
| Conrad Maldives | `conrad_maldives_rangali` | Maldives |
| Four Seasons Landaa | `four_seasons_landaa_giraavaru` | Maldives |
| Atlantis Dubai | `atlantis_the_palm` | Dubai |
| Burj Al Arab | `burj_al_arab_jumeirah` | Dubai |

## 🗺️ Common Region IDs

| Region | Region ID |
|--------|-----------|
| Maldives | 109 |
| Dubai | 815 |
| Bali | 3645 |
| Phuket | 2676 |
| Paris | 4913 |

## 💰 Supported Currencies

- `USD` - US Dollar (Recommended)
- `EUR` - Euro
- `RUB` - Russian Ruble
- `GBP` - British Pound
- `AED` - UAE Dirham

## 🧪 Testing

### Local Development

```bash
# Start server
npm run dev

# Run hotel endpoint tests
node test-hotel-endpoint.mjs

# Test specific hotel
curl "http://localhost:3000/api/ov/hotel?hotel=reethi_faru_resort"
```

### Production

```bash
curl "https://your-project.vercel.app/api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17"
```

## 🔒 Features

- ✅ **Rate Limiting**: 60 requests per minute per IP
- ✅ **CORS Enabled**: Cross-origin requests allowed
- ✅ **Auto UUID Generation**: Session and search UUIDs generated automatically
- ✅ **Edge Runtime**: Fast global performance
- ✅ **Dual Methods**: GET (simple) and POST (complex) support
- ✅ **Smart Defaults**: Automatic date generation and sensible fallbacks
- ✅ **Flexible Paxes**: Support for multiple room configurations
- ✅ **Error Handling**: Comprehensive validation and error responses

## 🚨 Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success - Hotel details retrieved |
| 400 | Bad Request - Missing hotel parameter or invalid format |
| 405 | Method Not Allowed - Use GET or POST only |
| 429 | Rate Limit Exceeded - Wait before making more requests |
| 500 | Internal Server Error - Ostrovok API or network issue |

## 💡 Usage Tips

1. **Hotel Identifier**: Use the exact hotel slug from Ostrovok.ru URLs
2. **Date Format**: Always use `YYYY-MM-DD` format for dates  
3. **Currency**: Use `USD` for international pricing consistency
4. **Paxes**:
   - GET: `paxes=2,1,3` for multiple rooms
   - POST: `[{adults:2}, {adults:1}, {adults:3}]` for detailed config
5. **Caching**: Results include `search_uuid` for session tracking
6. **Rate Limits**: Space out requests to avoid hitting limits

## 🔗 Related Endpoints

- `GET|POST /api/ov/search` - Ostrovok hotel search
- `POST /api/search` - AnexTour hotel search  
- `GET /api/hotels` - AnexTour hotel details
- `GET /api/health` - API health check

## 📋 Quick Reference

```bash
# Simple GET - Hotel only
/api/ov/hotel?hotel=reethi_faru_resort

# GET with dates
/api/ov/hotel?hotel=reethi_faru_resort&arrival_date=2026-01-12&departure_date=2026-01-17

# GET with multiple rooms
/api/ov/hotel?hotel=reethi_faru_resort&paxes=2,1&currency=USD

# POST with full config
curl -X POST /api/ov/hotel -d '{"hotel":"reethi_faru_resort","paxes":[{"adults":2}]}'
```