'use client';
import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, App, Divider, Row, Col, Avatar, Tag, Space } from 'antd';
import { UserOutlined, KeyOutlined, SaveOutlined } from '@ant-design/icons';
import { authApi, AdminUser } from '@/utils/api';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => { authApi.getMe().then(setUser).catch(() => {}); }, []);

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      pwForm.resetFields();
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Thông Tin Của Tôi</Title>
      <Row gutter={20}>
        {/* Thông tin tài khoản */}
        <Col xs={24} lg={10}>
          <Card title="Thông Tin Tài Khoản">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={72} icon={<UserOutlined />}
                style={{ background: '#f39221', fontSize: 32, marginBottom: 12 }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{user?.fullName}</Title>
                <Text type="secondary">{user?.email}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={user?.role === 'super_admin' ? 'red' : 'blue'}>
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </Tag>
                  <Tag color={user?.isActive ? 'green' : 'default'}>
                    {user?.isActive ? 'Đang hoạt động' : 'Bị khoá'}
                  </Tag>
                </div>
              </div>
            </div>
            <Divider />
            <div style={{ fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary">Email</Text>
                <Text strong>{user?.email}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary">Vai trò</Text>
                <Text strong>{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <Text type="secondary">Trạng thái</Text>
                <Tag color={user?.isActive ? 'green' : 'default'} style={{ margin: 0 }}>
                  {user?.isActive ? 'Đang hoạt động' : 'Bị khoá'}
                </Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Đổi mật khẩu */}
        <Col xs={24} lg={14}>
          <Card title={<Space><KeyOutlined /> Đổi Mật Khẩu</Space>}>
            <Form form={pwForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}
                loading={changingPassword} block
                style={{ background: '#f39221', borderColor: '#f39221' }}>
                Đổi Mật Khẩu
              </Button>
            </Form>

            <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
              <Text style={{ fontSize: 12 }}>
                ⚠️ Sau khi đổi mật khẩu, bạn sẽ được tự động đăng xuất và cần đăng nhập lại.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
