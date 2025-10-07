export class ApiUtils {
  static createResponse(
    data: any,
    status: number = 200,
    headers: Record<string, string> = {}
  ): Response {
    const defaultHeaders = {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      ...headers
    };

    return new Response(JSON.stringify(data), {
      status,
      headers: defaultHeaders
    });
  }

  static createError(
    message: string,
    status: number = 500,
    details?: any
  ): Response {
    return this.createResponse(
      {
        error: message,
        details,
        timestamp: new Date().toISOString()
      },
      status
    );
  }

  static createSuccess(data: any, message?: string): Response {
    return this.createResponse({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  }

  static getClientIp(req: Request): string {
    return (
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown"
    );
  }

  static parseUrl(url: string): { pathname: string; searchParams: URLSearchParams } {
    const parsedUrl = new URL(url);
    return {
      pathname: parsedUrl.pathname,
      searchParams: parsedUrl.searchParams
    };
  }

  static handleCors(): Response {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }
}