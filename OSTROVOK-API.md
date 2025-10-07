# Ostrovok.ru Hotel Search API Proxy

## 🎯 Endpoint

**URL**: `GET|POST /api/ov/search`  
**Methods**: `GET` (URL params) or `POST` (JSON body)  
**Runtime**: Edge  
**Rate Limit**: 60 requests per minute per IP

## 📝 Description

Proxy endpoint for Ostrovok.ru hotel search API. Supports both GET requests with URL parameters (simple) and POST requests with JSON body (complex) for hotel searches across various regions.

## 🔧 Request Parameters

All parameters are optional. The endpoint uses sensible defaults if not provided.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `region_id` | number | `109` | Region ID (109 = Maldives) |
| `arrival_date` | string | `2025-11-10` | Check-in date (YYYY-MM-DD) |
| `departure_date` | string | `2025-11-15` | Check-out date (YYYY-MM-DD) |
| `adults` | number | `2` | Number of adults |
| `currency` | string | `RUB` | Currency code (RUB, USD, EUR, etc.) |
| `language` | string | `en` | Language code (en, ru, etc.) |
| `page` | number | `1` | Page number for pagination |
| `kinds` | string[] | `["resort"]` | Hotel types (resort, hotel, etc.) |
| `sort` | string | `price_asc` | Sort order (price_asc, price_desc, rating_asc, rating_desc) |
| `map_hotels` | boolean | `true` | Include map data in response |

## 📤 Request Examples

### 🔍 GET Method (URL Parameters) - SIMPLE

**Basic Request:**

```bash
curl "http://localhost:3000/api/ov/search?arrival_date=2025-11-20&departure_date=2025-11-25&adults=2"
```

**Full Request:**

```bash
curl "http://localhost:3000/api/ov/search?region_id=109&arrival_date=2025-11-10&departure_date=2025-11-15&adults=2&currency=USD&language=en&page=1&kinds=resort,hotel&sort=price_asc&map_hotels=true"
```

**Minimal Request (All Defaults):**

```bash
curl "http://localhost:3000/api/ov/search"
```

### 📤 POST Method (JSON Body) - COMPLEX

**Full Request with Custom Parameters:**

```bash
curl -X POST "http://localhost:3000/api/ov/search" \
  -H "Content-Type: application/json" \
  -d '{
    "region_id": 109,
    "arrival_date": "2025-11-10",
    "departure_date": "2025-11-15",
    "adults": 2,
    "currency": "USD",
    "language": "en",
    "page": 1,
    "kinds": ["resort"],
    "sort": "price_asc",
    "map_hotels": true
  }'
```

**Minimal POST (All Defaults):**

```bash
curl -X POST "http://localhost:3000/api/ov/search" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### JavaScript/Fetch Example

```javascript
const searchHotels = async (params) => {
  const response = await fetch('http://localhost:3000/api/ov/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      region_id: 109,
      arrival_date: '2025-12-01',
      departure_date: '2025-12-07',
      adults: 2,
      currency: 'USD',
      ...params
    })
  });
  
  return await response.json();
};

// Usage
const results = await searchHotels({
  region_id: 815, // Dubai
  adults: 4
});
```

## 📥 Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "hotels": [...],
    "total": 150,
    "page": 1,
    "filters": {...},
    ...
  },
  "metadata": {
    "session_id": "generated-uuid",
    "search_uuid": "generated-uuid",
    "search_params": {
      "region_id": 109,
      "arrival_date": "2025-11-10",
      "departure_date": "2025-11-15",
      "adults": 2,
      "currency": "RUB",
      "page": 1
    }
  },
  "message": "Hotels fetched successfully from Ostrovok",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Error Response (4xx/5xx)
```json
{
  "error": "Error description",
  "details": {
    "originalError": "Detailed error message"
  },
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

## 🗺️ Common Region IDs

| Region | Region ID |
|--------|-----------|
| Maldives | 109 |
| Dubai | 815 |
| Bali | 3645 |
| Phuket | 2676 |
| Paris | 4913 |

## 🔄 Sort Options

- `price_asc` - Price: Low to High
- `price_desc` - Price: High to Low
- `rating_asc` - Rating: Low to High
- `rating_desc` - Rating: High to Low
- `popularity` - Most Popular

## 🧪 Testing

### Local Development
```bash
# Start server
npm run dev

# Run tests
node test-ostrovok.mjs
```

### Production
```bash
curl -X POST "https://your-project.vercel.app/api/ov/search" \
  -H "Content-Type: application/json" \
  -d '{"region_id": 109, "adults": 2}'
```

## 🔒 Features

- ✅ **Rate Limiting**: 60 requests per minute per IP
- ✅ **CORS Enabled**: Cross-origin requests allowed
- ✅ **Auto UUID Generation**: Session and search UUIDs generated automatically
- ✅ **Edge Runtime**: Fast global performance
- ✅ **Flexible Parameters**: Use defaults or customize as needed
- ✅ **Error Handling**: Comprehensive error responses

## 🚨 Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 405 | Method Not Allowed (use POST) |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## 💡 Tips

1. **Currency**: Use `USD` or `EUR` for international bookings instead of `RUB`
2. **Date Format**: Always use `YYYY-MM-DD` format
3. **Pagination**: Use `page` parameter to load more results
4. **Kinds Filter**: Combine multiple types like `["resort", "hotel", "apartment"]`
5. **Session Tracking**: Use the returned `session_id` for debugging

## 🔗 Related Endpoints

- `POST /api/search` - AnexTour hotel search
- `GET /api/hotels` - AnexTour hotel details
- `GET /api/health` - API health check