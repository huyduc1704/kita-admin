'use client';
import { useEffect, useState } from 'react';
import { Layout, Dropdown, Avatar, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, KeyOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { authApi, AdminUser } from '@/utils/api';

const { Header } = Layout;

export default function MainHeader({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  useEffect(() => { authApi.getMe().then(setUser).catch(() => {}); }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    router.replace('/login');
  };

  const menu = {
    items: [
      { key: 'profile', icon: <KeyOutlined />, label: 'Đổi Mật Khẩu', onClick: () => router.push('/admin/profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng Xuất', danger: true, onClick: handleLogout },
    ],
  };

  return (
    <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span onClick={onToggle} style={{ fontSize: 18, cursor: 'pointer', color: '#666' }}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </span>

      <Dropdown menu={menu} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} style={{ background: '#f39221' }} />
          <Typography.Text strong>{user?.fullName || 'Admin'}</Typography.Text>
        </Space>
      </Dropdown>
    </Header>
  );
}
