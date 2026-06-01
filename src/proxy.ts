import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/jwt';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes that don't need auth
  const isPublicRoute =
    path === '/' ||
    path === '/sign-in' ||
    path === '/sign-up' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/orchestrator/run') ||
    path.startsWith('/api/webhooks');

  const session = request.cookies.get('session')?.value;
  let parsedSession = null;

  if (session) {
    try {
      parsedSession = await decrypt(session);
    } catch (e) {
      // Invalid session — treat as unauthenticated
    }
  }

  if (!isPublicRoute && !parsedSession?.userId) {
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/sign-in', request.nextUrl));
  }

  // Already authenticated — don't show auth pages
  if ((path === '/sign-in' || path === '/sign-up') && parsedSession?.userId) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
