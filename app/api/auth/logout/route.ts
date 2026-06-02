import { NextRequest, NextResponse } from 'next/server';

const BE = process.env.BACKEND_API_URL || 'http://localhost:4000/api';

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  if (accessToken) {
    await fetch(`${BE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  }

  const res = NextResponse.json({ message: 'Đăng xuất thành công' });
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');
  return res;
}
