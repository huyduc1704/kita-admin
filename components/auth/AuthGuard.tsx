'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { authApi } from '@/utils/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login') { setChecking(false); return; }
    authApi.getMe()
      .then(() => setChecking(false))
      .catch(() => router.replace('/login'));
  }, [pathname, router]);

  if (checking && pathname !== '/login') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Đang xác thực..." />
      </div>
    );
  }

  return <>{children}</>;
}
