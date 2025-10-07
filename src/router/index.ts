import type { Route, RouteHandler } from "../types";

export class Router {
  private routes: Route[] = [];

  add(method: string, path: string, handler: RouteHandler): void {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler
    });
  }

  get(path: string, handler: RouteHandler): void {
    this.add("GET", path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.add("POST", path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.add("PUT", path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.add("DELETE", path, handler);
  }

  options(path: string, handler: RouteHandler): void {
    this.add("OPTIONS", path, handler);
  }

  match(method: string, pathname: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;

      const params = this.matchPath(route.path, pathname);
      if (params !== null) {
        return { route, params };
      }
    }
    return null;
  }

  private matchPath(routePath: string, requestPath: string): Record<string, string> | null {
    const routeSegments = routePath.split("/").filter(Boolean);
    const requestSegments = requestPath.split("/").filter(Boolean);

    if (routeSegments.length !== requestSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const requestSegment = requestSegments[i];

      if (!routeSegment || !requestSegment) {
        return null;
      }

      if (routeSegment.startsWith(":")) {
        // This is a parameter
        const paramName = routeSegment.slice(1);
        params[paramName] = requestSegment;
      } else if (routeSegment !== requestSegment) {
        // Static segment doesn't match
        return null;
      }
    }

    return params;
  }

  getRoutes(): Route[] {
    return [...this.routes];
  }
}