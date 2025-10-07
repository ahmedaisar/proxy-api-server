# Hotel Scraping Endpoint Documentation

## Overview

The `/api/ov/scrape` endpoint extracts structured hotel data from Ostrovok.ru hotel pages. It supports multiple input methods and constructs the complete Ostrovok URL using the hotel's metadata.

## Complete URL Structure

Ostrovok hotel URLs follow this pattern:
```
https://ostrovok.ru/hotel/{region_catalog_slug}/mid{master_id}/{ota_hotel_id}/
```

**Example:**
```
https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/
```

## Required Data Fields

From Ostrovok search results, you need:

1. `master_id` - Numeric hotel identifier (e.g., `6669997`)
2. `ota_hotel_id` - Hotel slug identifier (e.g., `canareef_resort_maldives`)  
3. `static_vm.region_catalog_slug` - Region path (e.g., `maldives/addu_atoll`)

## API Methods

### Method 1: POST with Hotel Object (Recommended)

**Endpoint:** `POST /api/ov/scrape`

**Request Body:**
```json
{
  "hotel": {
    "master_id": 6669997,
    "ota_hotel_id": "canareef_resort_maldives",
    "static_vm": {
      "region_catalog_slug": "maldives/addu_atoll"
    }
  }
}
```

**Benefits:**
- Pass complete hotel object from search results
- No URL encoding issues
- Most flexible approach

### Method 2: GET with Individual Parameters

**Endpoint:** `GET /api/ov/scrape`

**Query Parameters:**
- `master_id` - Hotel's master ID
- `ota_hotel_id` - Hotel's OTA ID
- `region_slug` - Hotel's region catalog slug

**Example:**
```
GET /api/ov/scrape?master_id=6669997&ota_hotel_id=canareef_resort_maldives&region_slug=maldives/addu_atoll
```

### Method 3: Direct URL Parameter

**Endpoint:** `GET /api/ov/scrape`

**Query Parameters:**
- `url` - Complete Ostrovok hotel URL

**Example:**
```
GET /api/ov/scrape?url=https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "master_id": "6669997",
    "ota_hotel_id": "canareef_resort_maldives", 
    "region_slug": "maldives/addu_atoll",
    "source_url": "https://ostrovok.ru/hotel/maldives/addu_atoll/mid6669997/canareef_resort_maldives/",
    "scraped_at": "2025-10-07T12:15:30.123Z",
    "hotel": {
      "name": "Canareef Resort Maldives",
      "rating": 9.2,
      "price": "$450",
      "location": "Herathera Island, Addu Atoll, Maldives",
      "images": ["https://cdn.worldota.net/...", "..."],
      "amenities": ["wifi", "pool", "spa", "restaurant", "beach"],
      "description": "Luxury resort located on...",
      "contact": {
        "phone": "+960 123-4567",
        "email": "info@canareef.com", 
        "website": "https://canareef.com"
      },
      "rooms": [
        {
          "type": "Beach Villa",
          "price": "$450/night",
          "description": "Spacious villa with ocean view"
        }
      ]
    }
  },
  "message": "Hotel data scraped successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Missing required parameters",
  "message": "Provide either 'url' parameter OR all of: master_id, ota_hotel_id, region_slug"
}
```

## Complete Workflow Example

### Step 1: Search for Hotels

```javascript
const searchResponse = await fetch('/api/ov/search?region_id=109&arrival_date=2025-11-10&departure_date=2025-11-15&adults=2');
const searchData = await searchResponse.json();
```

### Step 2: Extract Hotel Data

```javascript
const hotel = searchData.data.hotels[0]; // First hotel from results
const { master_id, ota_hotel_id, static_vm } = hotel;
```

### Step 3: Scrape Hotel Details

```javascript
// Method A: POST with hotel object
const scrapeResponse = await fetch('/api/ov/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ hotel: hotel })
});

// Method B: GET with parameters  
const params = new URLSearchParams({
  master_id: master_id,
  ota_hotel_id: ota_hotel_id,
  region_slug: static_vm.region_catalog_slug
});
const scrapeResponse = await fetch(`/api/ov/scrape?${params}`);
```

### Step 4: Use Structured Data

```javascript
const scrapeData = await scrapeResponse.json();
if (scrapeData.success) {
  const hotelDetails = scrapeData.data.hotel;
  console.log('Hotel Name:', hotelDetails.name);
  console.log('Rating:', hotelDetails.rating);
  console.log('Images:', hotelDetails.images.length);
  console.log('Amenities:', hotelDetails.amenities);
}
```

## Rate Limiting

- **Limit:** 60 requests per minute per IP
- **Headers:** Rate limit info included in response headers
- **Error:** 429 status when limit exceeded

## Data Extraction

The scraper extracts:

- **Basic Info:** Name, rating, price, location
- **Media:** Hotel images (up to 10)
- **Amenities:** Available facilities and services
- **Description:** Hotel overview text
- **Contact:** Phone, email, website (if available)
- **Rooms:** Room types and pricing (if available)
- **Structured Data:** JSON-LD metadata when present

## Error Handling

Common error scenarios:

1. **Missing Parameters:** 400 - Invalid or missing required parameters
2. **Invalid master_id:** 400 - master_id must be numeric
3. **Hotel Not Found:** 500 - Ostrovok page returns 404
4. **Rate Limited:** 429 - Too many requests
5. **Scraping Failed:** 500 - HTML parsing or network error

## Best Practices

1. **Use POST Method:** More reliable for complex hotel objects
2. **Handle Errors:** Check `success` field in response
3. **Cache Results:** Avoid repeated scraping of same hotel
4. **Respect Rate Limits:** Implement client-side throttling
5. **Validate Data:** Check for required fields before scraping