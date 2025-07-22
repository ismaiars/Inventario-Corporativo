import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window for mutating methods
const clients = new Map<string, { count: number; reset: number }>();

function isMutating(method: string) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

export default withAuth(
  function middleware(request) {
    const response = NextResponse.next();

    // Attach security headers to all responses
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=()');
    response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; object-src 'none';");

    // Apply rate limiting only to API routes that are mutating data
    if (request.nextUrl.pathname.startsWith('/api/') && isMutating(request.method)) {
      const ip = request.headers.get('x-real-ip') || request.ip || 'unknown';
      const now = Date.now();
      const entry = clients.get(ip);

      if (!entry || now > entry.reset) {
        clients.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
      } else {
        entry.count += 1;
        if (entry.count > RATE_LIMIT_MAX) {
          return new NextResponse(JSON.stringify({ message: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (the NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
    '/api/:path*'
  ],
}; 