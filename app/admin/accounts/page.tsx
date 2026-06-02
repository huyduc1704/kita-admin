'use client';
import { useEffect, useState } from 'react';
import {
  Table, Button, Tag, Switch, Space, Typography,
  Modal, Form, Input, Select, App, Tooltip, Badge,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi, AdminUser } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', color: 'red' },
  admin:       { label: 'Admin',       color: 'blue' },
};

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  const load = () => {
    setLoading(true);
    adminApi.getAll().then(setAdmins).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: 'admin', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (admin: AdminUser) => {
    setEditing(admin);
    form.setFieldsValue({
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (values: {
    email: string; password?: string; fullName: string;
    role: string; isActive: boolean;
  }) => {
    setSaving(true);
    try {
      if (editing) {
        await adminApi.update(editing.id, {
          fullName: values.fullName,
          role: values.role as AdminUser['role'],
          isActive: values.isActive,
        });
        message.success('Cập nhật tài khoản thành công');
      } else {
        if (!values.password) { message.error('Vui lòng nhập mật khẩu'); setSaving(false); return; }
        await adminApi.create({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          role: values.role,
        });
        message.success('Tạo tài khoản thành công');
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (admin: AdminUser, checked: boolean) => {
    try {
      await adminApi.update(admin.id, { isActive: checked });
      setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, isActive: checked } : a));
    } catch { message.error('Cập nhật thất bại'); }
  };

  const handleDelete = (admin: AdminUser) => {
    modal.confirm({
      title: `Xoá tài khoản "${admin.fullName}"?`,
      content: 'Hành động này không thể hoàn tác.',
      okType: 'danger', okText: 'Xoá', cancelText: 'Huỷ',
      onOk: async () => {
        await adminApi.remove(admin.id);
        message.success('Đã xoá tài khoản');
        load();
      },
    });
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: 'Tài khoản', key: 'info',
      render: (_, a) => (
        <Space direction="vertical" size={2}>
          <Text strong>{a.fullName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{a.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Vai trò', dataIndex: 'role', width: 130,
      render: (r: string) => {
        const cfg = ROLE_CONFIG[r as keyof typeof ROLE_CONFIG];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', width: 120,
      render: (d: string) => <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>,
    },
    {
      title: 'Kích hoạt', width: 90, align: 'center' as const,
      render: (_, a) => <Switch size="small" checked={a.isActive} onChange={(c) => handleToggle(a, c)} />,
    },
    {
      title: '', width: 90, align: 'center' as const,
      render: (_, a) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(a)} />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(a)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Tài Khoản Admin <Badge count={admins.length} style={{ background: '#f39221', marginLeft: 8 }} />
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Quản lý tài khoản đăng nhập vào trang admin</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#f39221', borderColor: '#f39221' }}>
          Thêm Tài Khoản
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={admins}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Admin'}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Lưu' : 'Tạo'}
        confirmLoading={saving}
        okButtonProps={{ style: { background: '#f39221', borderColor: '#f39221' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="email" label="Email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="admin@gammahome.vn" disabled={!!editing} />
          </Form.Item>

          {!editing && (
            <Form.Item name="password" label="Mật khẩu"
              rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
              <Input.Password placeholder="••••••••" />
            </Form.Item>
          )}

          <Form.Item name="role" label="Vai trò">
            <Select
              options={[
                { value: 'admin', label: <><Tag color="blue">Admin</Tag> — Quản lý nội dung</> },
                { value: 'super_admin', label: <><Tag color="red">Super Admin</Tag> — Toàn quyền</> },
              ]}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
