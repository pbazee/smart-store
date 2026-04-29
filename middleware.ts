import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We use a simplified middleware to reduce cold starts and bundle size
// Matcher is configured to only run on relevant routes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Minimal session check for admin routes
  if (pathname.startsWith('/admin')) {
    // Check for common auth cookies
    const hasSession = request.cookies.getAll().some(
      cookie => (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')) || 
                cookie.name === 'ske_local_auth' || 
                cookie.name === 'ske_demo_auth'
    );
    
    if (!hasSession) {
      const loginUrl = new URL('/sign-in', request.url);
      loginUrl.searchParams.set('redirect_url', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Only run on admin routes to minimize impact on site performance
  matcher: ['/admin/:path*'],
};
