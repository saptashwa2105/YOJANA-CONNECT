import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");

  // If unauthenticated and trying to access a protected route, redirect to /login
  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to visit /login, redirect to landing /
  if (token && isAuthPage) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API endpoints)
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico, images/ (static public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};

