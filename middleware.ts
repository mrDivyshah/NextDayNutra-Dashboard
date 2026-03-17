import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/favicon.ico",
]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) {
    if (pathname.startsWith("/super-admin") && token.role !== "super_admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
