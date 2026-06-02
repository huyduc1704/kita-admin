'use client';
import { useState } from 'react';
import { Layout } from 'antd';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import MainSider from './MainSider';
import MainHeader from './MainHeader';

const { Content, Footer } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) return <>{children}</>;

  const siderWidth = collapsed ? 80 : 260;

  return (
    <AuthGuard>
      <Layout style={{ minHeight: '100vh' }}>
        <MainSider collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s' }}>
          <MainHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <Content style={{ margin: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px - 48px)' }}>
            {children}
          </Content>
          <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 24px', fontSize: 12, color: '#999' }}>
            © {new Date().getFullYear()} Gamma Admin — Gamma Home
          </Footer>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
