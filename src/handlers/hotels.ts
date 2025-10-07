import { ApiUtils } from "../utils/api";
import type { ApiRequest } from "../types";

// Parameter mapping for AnexTour API
const paramMap: Record<string, string> = {
  charter: "CHARTER",
  adults: "ADULT",
  ages: "AGES",
  checkin: "CHECKIN_BEG",
  checkout: "CHECKIN_END",
  children: "CHILD",
  costmax: "COSTMAX",
  costmin: "COSTMIN",
  currency: "CURRENCY",
  filter: "FILTER",
  freight: "FREIGHT",
  statefrom: "STATEFROM",
  partition_price: "PARTITION_PRICE",
  price_page: "PRICE_PAGE",
  reconpage: "RECONPAGE",
  regular: "REGULAR",
  search_mode: "SEARCH_MODE",
  search_type: "SEARCH_TYPE",
  sort_type: "SORT_TYPE",
  state: "STATE",
  the_best_at_top: "THE_BEST_AT_TOP",
  townfrom: "TOWNFROM",
  nightmin: "NIGHTMIN",
  nightmax: "NIGHTMAX"
};

const defaults: Record<string, string> = {
  CHARTER: "True",
  ADULT: "2",
  AGES: "",
  CHECKIN_BEG: "20251111",
  CHECKIN_END: "20251114",
  CHILD: "0",
  COSTMAX: "",
  COSTMIN: "",
  CURRENCY: "1",
  FILTER: "1",
  FREIGHT: "1",
  STATEFROM: "2",
  PARTITION_PRICE: "32",
  PRICE_PAGE: "1",
  RECONPAGE: "40",
  REGULAR: "True",
  SEARCH_MODE: "b2c",
  SEARCH_TYPE: "PACKET_ONLY_HOTELS",
  SORT_TYPE: "0",
  STATE: "176",
  THE_BEST_AT_TOP: "false",
  TOWNFROM: "1",
  NIGHTMIN: "7",
  NIGHTMAX: "7"
};

export async function searchHotels(req: ApiRequest): Promise<Response> {
  try {
    const url = new URL(req.url);
    
    // Build query parameters
    const params = new URLSearchParams(defaults);
    for (const [key, value] of url.searchParams.entries()) {
      const mappedKey = paramMap[key.toLowerCase()] || key.toUpperCase();
      params.set(mappedKey, value);
    }

    const apiUrl = `https://api.anextour.ru/search?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        referer: "https://anextour.ru/"
      }
    });

    const data = await response.json();

    return ApiUtils.createSuccess(data, "Hotels fetched successfully");
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return ApiUtils.createError(
      "Failed to fetch tours",
      500,
      { originalError: errorMessage }
    );
  }
}

export async function getHotelById(req: ApiRequest): Promise<Response> {
  const slug = req.params?.id;
  
  try {
    if (!slug) {
      return ApiUtils.createError("Hotel slug is required", 400);
    }

    // URL encode the hotel slug for the API request
    const encodedHotelSlug = encodeURIComponent(slug);
    const apiUrl = `https://api.anextour.ru/b2c/hotel?hotel=${encodedHotelSlug}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*"
      }
    });

    if (!response.ok) {
      return ApiUtils.createError(
        `Failed to fetch hotel details: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();

    return ApiUtils.createSuccess(data, "Hotel details fetched successfully");
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error && typeof error === "object" && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }
    
    return ApiUtils.createError(
      "Failed to fetch hotel details",
      500,
      { originalError: errorMessage, slug }
    );
  }
}

export async function healthCheck(_req: ApiRequest): Promise<Response> {
  return ApiUtils.createSuccess(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0"
    },
    "API is healthy"
  );
}