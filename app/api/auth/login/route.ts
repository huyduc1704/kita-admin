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
  const body = await req.json();
  const beRes = await fetch(`${BE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await beRes.json();
  if (!beRes.ok) return NextResponse.json(data, { status: beRes.status });

  const { accessToken, refreshToken, ...rest } = data;
  const res = NextResponse.json(rest);
  res.cookies.set('access_token',  accessToken,  cookieOpts(15 * 60));
  res.cookies.set('refresh_token', refreshToken, cookieOpts(7 * 24 * 60 * 60));
  return res;
}
