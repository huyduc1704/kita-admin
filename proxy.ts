import { NextRequest, NextResponse } from 'next/server';

// Inject Bearer token từ httpOnly cookie vào tất cả /api/* requests
// trước khi Next.js rewrite chúng sang gamma-be
export function proxy(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  if (accessToken) {
    const headers = new Headers(req.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
