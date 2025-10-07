# Hotel Details Endpoint Testing Guide

## 🎯 Endpoint Information

**URL Pattern**: `/api/hotels/[slug]`  
**Method**: `GET`  
**Runtime**: Edge  
**Rate Limit**: 60 requests per minute per IP  

## 🧪 Testing Methods

### 1. Local Development Testing

First, start the local development server:
```bash
npm run dev
# or
vercel dev
```

### 2. Get Hotel Slugs from Search

Before testing hotel details, you need to get valid hotel slugs from the search endpoint:

```bash
# Search for hotels first
curl "http://localhost:3000/api/search?adults=2&checkin=20251111&checkout=20251114&state=176"
```

Look for hotel identifiers in the response that can be used as slugs.

### 3. Test Hotel Details Endpoint

#### Local Testing:
```bash
# Replace [HOTEL_SLUG] with actual slug from search results
curl "http://localhost:3000/api/hotels/[HOTEL_SLUG]"

# Example with URL encoding if slug contains special characters:
curl "http://localhost:3000/api/hotels/hotel-name-123"
```

#### Production Testing (after deployment):
```bash
# Replace your-project-name with your actual Vercel project name
curl "https://your-project-name.vercel.app/api/hotels/[HOTEL_SLUG]"
```

### 4. Test with Different Tools

#### Using curl:
```bash
# Basic request
curl -X GET "http://localhost:3000/api/hotels/hotel-slug-here"

# With headers
curl -X GET "http://localhost:3000/api/hotels/hotel-slug-here" \
  -H "Accept: application/json"
```

#### Using JavaScript/Fetch:
```javascript
// Test in browser console or Node.js
async function testHotelDetails(slug) {
  try {
    const response = await fetch(`http://localhost:3000/api/hotels/${encodeURIComponent(slug)}`);
    const data = await response.json();
    console.log('Hotel Details:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
testHotelDetails('your-hotel-slug-here');
```

#### Using Postman:
1. Method: `GET`
2. URL: `http://localhost:3000/api/hotels/[HOTEL_SLUG]`
3. Headers: `Accept: application/json`

## 📋 Expected Response Format

### Success Response (200):
```json
{
  "success": true,
  "data": {
    // Hotel details from AnexTour API
  },
  "message": "Hotel details fetched successfully",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

### Error Responses:

#### Missing Slug (400):
```json
{
  "error": "Hotel slug is required",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

#### Rate Limited (429):
```json
{
  "error": "Rate limit exceeded. Try again later.",
  "details": {
    "remaining": 0,
    "resetTime": "60 seconds"
  },
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

#### Hotel Not Found (404 or 500):
```json
{
  "error": "Failed to fetch hotel details: 404 Not Found",
  "timestamp": "2025-10-07T12:00:00.000Z"
}
```

## 🔧 Testing Scenarios

### 1. Valid Hotel Slug
Test with a known valid hotel identifier from search results.

### 2. Invalid/Non-existent Slug
```bash
curl "http://localhost:3000/api/hotels/non-existent-hotel"
```

### 3. Special Characters in Slug
```bash
curl "http://localhost:3000/api/hotels/hotel%2Fwith%2Fslashes"
```

### 4. Empty Slug
```bash
curl "http://localhost:3000/api/hotels/"
# This should return 404 from Vercel routing
```

### 5. Rate Limiting Test
Make 61+ requests quickly to test rate limiting:
```bash
for i in {1..65}; do
  curl "http://localhost:3000/api/hotels/test-slug-$i"
  echo "Request $i completed"
done
```

### 6. CORS Testing
```bash
# Test CORS preflight
curl -X OPTIONS "http://localhost:3000/api/hotels/test-slug" \
  -H "Access-Control-Request-Method: GET" \
  -H "Origin: http://example.com"
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Hotel slug is required"**
   - Make sure you're providing a slug in the URL path
   - Check URL encoding for special characters

2. **"Rate limit exceeded"**
   - Wait 60 seconds or test from different IP
   - Check rate limiter configuration

3. **"Failed to fetch hotel details"**
   - Verify the slug exists in AnexTour system
   - Check AnexTour API status

4. **Network/Connection errors**
   - Verify internet connection
   - Check if AnexTour API is accessible

## 📊 Testing Checklist

- [ ] Local development server starts successfully
- [ ] Health endpoint responds (`/api/health`)
- [ ] Search endpoint returns hotel data with identifiers
- [ ] Hotel details endpoint accepts valid slugs
- [ ] Error handling works for invalid slugs
- [ ] Rate limiting activates after 60 requests
- [ ] CORS headers are present in responses
- [ ] Deployment works on Vercel
- [ ] Production URLs respond correctly

## 🔗 Full Testing Workflow

1. **Start local server**: `npm run dev`
2. **Test health**: `curl http://localhost:3000/api/health`
3. **Get hotel slugs**: `curl "http://localhost:3000/api/search?adults=2"`
4. **Extract slug from search results**
5. **Test details**: `curl "http://localhost:3000/api/hotels/[extracted-slug]"`
6. **Deploy**: `npm run vercel:deploy`
7. **Test production**: `curl "https://your-project.vercel.app/api/hotels/[slug]"`