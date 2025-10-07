// Request and response types
export interface ApiRequest extends Request {
  params?: Record<string, string>;
  query?: URLSearchParams;
}

export interface ApiResponse {
  data?: any;
  error?: string;
  message?: string;
  status: number;
}

export interface RateLimitData {
  count: number;
  startTime: number;
}

export interface RouteHandler {
  (req: ApiRequest): Promise<Response> | Response;
}

export interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}