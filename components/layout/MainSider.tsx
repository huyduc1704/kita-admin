'use client';
import { useState } from 'react';
import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardOutlined, SettingOutlined, PictureOutlined,
  AppstoreOutlined, FileTextOutlined, PhoneOutlined,
  UserOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useSetting } from '@/components/providers/SettingProvider';

const { Sider } = Layout;

const MENU = [
  { key: '/', icon: <DashboardOutlined />, label: 'Bảng Điều Khiển' },
  {
    key: 'system-settings', icon: <SettingOutlined />, label: 'Cài Đặt Hệ Thống',
    children: [
      { key: '/system-settings/general', label: 'Thông Tin Chung' },
      { key: '/system-settings/logo', label: 'Logo & Favicon' },
      { key: '/system-settings/social-buttons', label: 'Nút Mạng Xã Hội' },
    ],
  },
  { key: '/hero-slides', icon: <PictureOutlined />, label: 'Hero Slides' },
  { key: '/categories', icon: <AppstoreOutlined />, label: 'Danh Mục' },
  {
    key: 'posts', icon: <FileTextOutlined />, label: 'Bài Viết & Dự Án',
    children: [
      { key: '/posts?type=project', label: 'Dự Án' },
      { key: '/posts?type=service', label: 'Dịch Vụ' },
      { key: '/posts?type=news', label: 'Tin Tức' },
      { key: '/posts?type=knowledge', label: 'Kiến Thức' },
      { key: '/posts?type=pricing', label: 'Báo Giá' },
    ],
  },
  { key: '/consultation-leads', icon: <PhoneOutlined />, label: 'Form Tư Vấn' },
  {
    key: 'admin', icon: <TeamOutlined />, label: 'Quản Lý Admin',
    children: [
      { key: '/admin/accounts', label: 'Tài Khoản Admin' },
      { key: '/admin/profile', label: 'Thông Tin Của Tôi' },
    ],
  },
];

export default function MainSider({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: (v: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setting } = useSetting();

  const selectedKey = MENU.flatMap((m) =>
    'children' in m && m.children ? m.children.map((c) => c.key) : [m.key]
  ).find((k) => pathname === k || pathname.startsWith(k + '/')) || '/';

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={260}
      style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
    >
      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 8px' : '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
        {setting?.logoUrl
          ? <img src={setting.logoUrl} alt="Logo" style={{ height: 36, objectFit: 'contain' }} />
          : <span style={{ fontWeight: 700, fontSize: collapsed ? 12 : 15, color: '#f39221', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {collapsed ? 'GA' : 'GAMMA ADMIN'}
            </span>
        }
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={['system-settings', 'posts', 'admin']}
        items={MENU}
        style={{ border: 'none', marginTop: 8 }}
        onClick={({ key }) => router.push(key)}
      />
    </Sider>
  );
}
