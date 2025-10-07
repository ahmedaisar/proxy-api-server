import { Router } from "./router";
import { RateLimiter } from "./middleware/rateLimiter";
import { ApiUtils } from "./utils/api";
import { getHotelById, healthCheck, searchHotels } from "./handlers/hotels";
import type { ApiRequest } from "./types";

export class ApiServer {
  private router: Router;
  private rateLimiter: RateLimiter;
  private port: number;

  constructor(port: number = 3000) {
    this.router = new Router();
    this.rateLimiter = new RateLimiter(60, 60_000); // 60 requests per minute
    this.port = port;
    
    this.setupRoutes();
    this.setupCleanupInterval();
  }

  private setupRoutes(): void {
    // Health check
    this.router.get("/health", healthCheck);
    
    // CORS preflight
    this.router.options("/*", () => ApiUtils.handleCors());

    // Hotel endpoints
    this.router.get("/api/hotels", searchHotels);
    this.router.get("/api/hotels/:id", getHotelById);

    // Legacy endpoint for backward compatibility
    this.router.get("/", async () => new Response("hello"));
  }

  private setupCleanupInterval(): void {
    // Clean up expired rate limit entries every 5 minutes
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 5 * 60 * 1000);
  }

  async handleRequest(req: Request): Promise<Response> {
    try {
      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return ApiUtils.handleCors();
      }

      // Rate limiting
      const ip = ApiUtils.getClientIp(req);
      const rateLimitResult = this.rateLimiter.check(ip);
      
      if (!rateLimitResult.allowed) {
        return ApiUtils.createError(
          "Rate limit exceeded. Try again later.",
          429,
          { remaining: rateLimitResult.remaining, resetTime: "60 seconds" }
        );
      }

      // Parse URL
      const { pathname } = ApiUtils.parseUrl(req.url);
      
      // Find matching route
      const match = this.router.match(req.method, pathname);
      
      if (!match) {
        return ApiUtils.createError("Endpoint not found", 404);
      }

      // Create enhanced request object
      const apiRequest: ApiRequest = Object.assign(req, {
        params: match.params,
        query: new URL(req.url).searchParams
      });

      // Execute handler
      return await match.route.handler(apiRequest);

    } catch (error) {
      console.error("Server error:", error);
      let errorMessage = "Internal server error";
      if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as { message: string }).message;
      }
      
      return ApiUtils.createError(errorMessage, 500);
    }
  }

  start(): void {
    Bun.serve({
      port: this.port,
      fetch: (req) => this.handleRequest(req)
    });
    
    console.log(`🚀 AnexTour API Server running on http://localhost:${this.port}`);
    console.log(`📚 Available endpoints:`);
    console.log(`   GET  /health          - Health check`);
    console.log(`   GET  /api/search      - Search hotels`);
    console.log(`   GET  /api/hotels/:id   - Get hotel details`);
    console.log(`   GET  /               - Legacy search endpoint`);
  }
}