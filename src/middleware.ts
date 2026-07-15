import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Paths requiring authentication
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/sessions");

  // Admin paths
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isProtectedPath) {
    if (!token) {
      // For API routes, return unauthorized JSON
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
      }
      // Otherwise, redirect to login
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify JWT
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });

      const userRole = payload.role as string;

      // If it's an admin/interviewer route, verify credentials
      if (isAdminPath) {
        if (userRole !== "admin" && userRole !== "interviewer") {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json({ error: "Forbidden access." }, { status: 403 });
          }
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    } catch (error) {
      // JWT verification failed
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  // If user is logged in, redirect them away from login/register to dashboard
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isAuthPage && token) {
    try {
      await jwtVerify(token, key, { algorithms: ["HS256"] });
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (e) {
      // Token invalid, allow page load and clear token cookie
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/report/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/api/sessions/:path*",
    "/api/admin/:path*",
  ],
};
