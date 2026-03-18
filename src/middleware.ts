import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";
import pool from "@/lib/db";

export async function middleware(request: NextRequest) {
  try {
    // Proceed with authentication logic
    const token = request.cookies.get("token")?.value;

    const isAuthPage = request.nextUrl.pathname.startsWith("/login");
    const isAdminPage = request.nextUrl.pathname.startsWith("/admin");

    // Protected API routes for mutations (POST, PUT, DELETE) needing admin
    const isProtectedApi =
      (request.nextUrl.pathname.startsWith("/api/categories") &&
        request.method !== "GET") ||
      (request.nextUrl.pathname.startsWith("/api/menu") &&
        request.method !== "GET");

    // Pages/routes that require any logged-in user
    const isUserProtectedPage =
      request.nextUrl.pathname.startsWith("/orders") ||
      request.nextUrl.pathname.startsWith("/checkout");

    let payload: any = null;
    if (token) {
      try {
        payload = await verifyJWT(token);
      } catch (error) {
        console.error("Error verifying JWT:", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    }

    // Redirect to admin if already logged in and trying to access login page
    if (isAuthPage) {
      if (payload) {
        return NextResponse.redirect(
          new URL(payload.role === "admin" ? "/admin" : "/", request.url),
        );
      }
      return NextResponse.next();
    }

    // Protect admin pages
    if (isAdminPage) {
      if (!payload) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    // Protect user pages (orders, checkout)
    if (isUserProtectedPage) {
      if (!payload) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.next();
    }

    // Protect certain API routes requiring admin role
    if (isProtectedApi) {
      if (!payload || payload.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // API protection: orders creation and payment requires login
    if (
      request.nextUrl.pathname.startsWith("/api/orders") &&
      request.method === "POST"
    ) {
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (
      request.nextUrl.pathname.startsWith("/api/payment") &&
      request.method === "POST"
    ) {
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.json(
      { error: `Internal server error ${error}` },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/api/:path*",
    "/orders",
    "/checkout/:path*",
  ],
};
