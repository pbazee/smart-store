import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We use a simplified middleware to reduce cold starts and bundle size
// Matcher is configured to only run on relevant routes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isCheckoutRoute = pathname.startsWith('/checkout');
  
  if (isAdminRoute || isCheckoutRoute) {
    // Check for common auth cookies
    const hasSession = request.cookies.getAll().some(
      cookie => (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) || 
                cookie.name === 'ske_local_auth' || 
                cookie.name === 'ske_demo_auth'
    );
    
    if (!hasSession) {
      const loginUrl = new URL('/sign-in', request.url);
      if (isCheckoutRoute) {
        loginUrl.searchParams.set('callbackUrl', pathname);
      } else {
        loginUrl.searchParams.set('redirect_url', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/checkout', '/checkout/:path*'],
};
