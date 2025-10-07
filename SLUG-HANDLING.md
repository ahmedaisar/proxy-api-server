# Hotel Slug Handling - Fixed Implementation

## 🎯 Problem Solved

The API endpoint `/api/hotels/` was conflicting with slugs that start with `/hotels/`.

## ✅ Solution

### Search Endpoint Returns:
```json
{
  "slug": "/hotels/maldives/arrival-beachspa"
}
```

### Method 1: Query Parameter (Recommended)
```
URL: GET /api/hotels?slug=/hotels/maldives/arrival-beachspa

Processing:
1. Extract from query: slug = "/hotels/maldives/arrival-beachspa"
2. Use as-is ✅
3. Send to AnexTour API: hotel=/hotels/maldives/arrival-beachspa
```

### Method 2: Path Parameter (Auto-Prefix)
```
URL: GET /api/hotels/maldives/arrival-beachspa

Processing:
1. Remove '/api/hotels': path = "/maldives/arrival-beachspa"
2. Add '/hotels' prefix: slug = "/hotels/maldives/arrival-beachspa" ✅
3. Send to AnexTour API: hotel=/hotels/maldives/arrival-beachspa
```

## 🔄 Flow Diagram

```
Search Endpoint
    ↓
Returns slug: "/hotels/maldives/arrival-beachspa"
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓                              ↓
Method 1 (Query)            Method 2 (Path)
    ↓                              ↓
?slug=/hotels/...           /api/hotels/maldives/...
    ↓                              ↓
Use as-is                   Add /hotels prefix
    ↓                              ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
Final slug: "/hotels/maldives/arrival-beachspa"
    ↓
AnexTour API: https://api.anextour.ru/b2c/hotel?hotel=%2Fhotels%2Fmaldives%2Farrival-beachspa
```

## 📝 Examples

### ✅ Correct Usage

**Using Query Parameter (Recommended):**
```bash
# Copy slug directly from search endpoint
curl "https://your-api.vercel.app/api/hotels?slug=/hotels/maldives/arrival-beachspa"
```

**Using Path Parameter:**
```bash
# Remove the /hotels prefix manually
curl "https://your-api.vercel.app/api/hotels/maldives/arrival-beachspa"
```

**Both produce the same result!**

### ❌ Common Mistakes (Now Prevented)

```bash
# ❌ WRONG: Including full slug in path
# This would try: /hotels/hotels/maldives/arrival-beachspa
curl "https://your-api.vercel.app/api/hotels/hotels/maldives/arrival-beachspa"
# Our fix prevents this!

# ❌ WRONG: No slug provided
curl "https://your-api.vercel.app/api/hotels"
# Returns helpful error with examples
```

## 🧪 Testing

Run the test script to verify:
```bash
npm run dev  # Start local server

# In another terminal:
node test-slug-handling.mjs
```

## 💡 Best Practice

**Use Method 1 (Query Parameter):**
- More explicit and clear
- No transformation needed
- Copy slug directly from search response
- Less chance of errors

```javascript
// Frontend example
const hotel = searchResults.hotels[0];
const detailsUrl = `/api/hotels?slug=${encodeURIComponent(hotel.slug)}`;
```