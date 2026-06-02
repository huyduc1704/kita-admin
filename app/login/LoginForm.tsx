'use client';
import { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/utils/api';

const { Title, Text } = Typography;

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await authApi.login(values.email, values.password);
      router.replace(params.get('returnUrl') || '/');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left - decorative */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #f39221 0%, #e07b10 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', padding: 40,
      }}>
        <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1, marginBottom: 12 }}>GAMMA</div>
        <div style={{ fontSize: 18, fontWeight: 300, opacity: 0.9 }}>ADMIN PANEL</div>
        <div style={{ marginTop: 32, opacity: 0.75, textAlign: 'center', fontSize: 13, lineHeight: 1.9 }}>
          Quản lý toàn bộ nội dung website<br />Gamma Home tại một nơi
        </div>
      </div>

      {/* Right - form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {params.get('session_expired') && (
            <div style={{ background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: 6, padding: '8px 12px', marginBottom: 20, color: '#d4380d', fontSize: 13 }}>
              Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
            </div>
          )}
          <Title level={3} style={{ marginBottom: 6 }}>Đăng nhập</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
            Nhập thông tin tài khoản để tiếp tục
          </Text>
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input prefix={<UserOutlined />} placeholder="admin@gammahome.vn" size="large" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} block size="large"
                style={{ background: '#f39221', borderColor: '#f39221' }}>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
