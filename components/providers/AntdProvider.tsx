'use client';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#f39221' } }}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
