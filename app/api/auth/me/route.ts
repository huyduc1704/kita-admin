import { NextRequest, NextResponse } from 'next/server';

const BE = process.env.BACKEND_API_URL || 'http://localhost:4000/api';

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  if (!accessToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const beRes = await fetch(`${BE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await beRes.json();
  return NextResponse.json(data, { status: beRes.status });
}
