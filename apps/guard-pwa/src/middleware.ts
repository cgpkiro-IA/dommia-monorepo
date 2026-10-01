import { NextRequest, NextResponse } from 'next/server';
import { buildCsp } from '../../next-csp';

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:css|js|mjs|map|svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|txt|xml|json|webmanifest)$).*)'],
};