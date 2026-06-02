import type { Metadata } from 'next';
import './globals.css';
import AntdProvider from '@/components/providers/AntdProvider';
import { SettingProvider } from '@/components/providers/SettingProvider';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Gamma Admin — Gamma Home',
  description: 'Trang quản trị website Gamma Home',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AntdProvider>
          <SettingProvider>
            <MainLayout>{children}</MainLayout>
          </SettingProvider>
        </AntdProvider>
      </body>
    </html>
  );
}
