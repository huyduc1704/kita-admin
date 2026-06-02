import { NextRequest, NextResponse } from 'next/server';

const BE = process.env.BACKEND_API_URL || 'http://localhost:4000/api';

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge,
  path: '/',
});

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const beRes = await fetch(`${BE}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'x-refresh-token': refreshToken },
  });

  const data = await beRes.json();
  if (!beRes.ok) return NextResponse.json(data, { status: beRes.status });

  const { accessToken, refreshToken: newRefresh, ...rest } = data;
  const res = NextResponse.json(rest);
  res.cookies.set('access_token',  accessToken, cookieOpts(15 * 60));
  res.cookies.set('refresh_token', newRefresh,  cookieOpts(7 * 24 * 60 * 60));
  return res;
}
