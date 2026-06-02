'use client';
import { useEffect, useState } from 'react';
import {
  Table, Button, Switch, Tag, Space, Modal, Form,
  Input, Select, App, Tooltip, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { systemSettingsApi, SocialButton } from '@/utils/api';

const { Title, Text } = Typography;

const TYPE_LABELS: Record<string, string> = {
  phone: '📞 Phone', zalo: '💬 Zalo', messenger: '💙 Messenger',
  facebook: '👍 Facebook', tiktok: '🎵 TikTok', youtube: '▶️ YouTube', custom: '🔗 Custom',
};
const POSITION_LABELS: Record<string, string> = {
  floating: 'Nút nổi (trái)', footer: 'Footer', both: 'Cả hai',
};

export default function SocialButtonsPage() {
  const [buttons, setButtons] = useState<SocialButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SocialButton | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  const load = () => {
    setLoading(true);
    systemSettingsApi.getSocialButtons().then(setButtons).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setIconFile(null);
    form.resetFields();
    form.setFieldsValue({ position: 'floating', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (btn: SocialButton) => {
    setEditing(btn); setIconFile(null);
    form.setFieldsValue(btn);
    setModalOpen(true);
  };

  const handleSave = async (values: Partial<SocialButton>) => {
    setSaving(true);
    try {
      if (editing) {
        await systemSettingsApi.updateSocialButton(editing.id, values);
        if (iconFile) await systemSettingsApi.uploadSocialIcon(editing.id, iconFile);
        message.success('Cập nhật thành công');
      } else {
        const created = await systemSettingsApi.createSocialButton(values);
        if (iconFile) await systemSettingsApi.uploadSocialIcon(created.id, iconFile);
        message.success('Tạo thành công');
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (btn: SocialButton, checked: boolean) => {
    await systemSettingsApi.updateSocialButton(btn.id, { isActive: checked });
    setButtons((prev) => prev.map((b) => b.id === btn.id ? { ...b, isActive: checked } : b));
  };

  const handleDelete = (btn: SocialButton) => {
    modal.confirm({
      title: 'Xoá nút này?', okType: 'danger', okText: 'Xoá', cancelText: 'Huỷ',
      onOk: async () => { await systemSettingsApi.deleteSocialButton(btn.id); message.success('Đã xoá'); load(); },
    });
  };

  const typeTag = (type: string) => <Tag>{TYPE_LABELS[type] || type}</Tag>;

  const columns: ColumnsType<SocialButton> = [
    {
      title: 'Icon', width: 60, align: 'center',
      render: (_, b) => b.iconUrl
        ? <img src={b.iconUrl} alt="icon" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }} />
        : <span style={{ fontSize: 20 }}>{TYPE_LABELS[b.type]?.split(' ')[0]}</span>,
    },
    { title: 'Loại', dataIndex: 'type', width: 130, render: typeTag },
    {
      title: 'Nhãn / Giá trị', key: 'info',
      render: (_, b) => (
        <Space direction="vertical" size={2}>
          <strong>{b.label}</strong>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {b.value} → <code style={{ fontSize: 11 }}>{b.resolvedLink}</code>
          </Text>
        </Space>
      ),
    },
    { title: 'Vị trí', dataIndex: 'position', width: 140, render: (v: string) => <Tag color="blue">{POSITION_LABELS[v]}</Tag> },
    {
      title: 'Hiển thị', dataIndex: 'isActive', width: 90, align: 'center',
      render: (v: boolean, b) => <Switch checked={v} onChange={(c) => handleToggle(b, c)} />,
    },
    {
      title: 'Thao tác', key: 'action', width: 100, align: 'center',
      render: (_, b) => (
        <Space>
          <Tooltip title="Sửa"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(b)} /></Tooltip>
          <Tooltip title="Xoá"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(b)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Nút Mạng Xã Hội</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Quản lý icon nổi bên trái và footer</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#f39221', borderColor: '#f39221' }}>
          Thêm Nút
        </Button>
      </div>

      <Table columns={columns} dataSource={buttons} rowKey="id" loading={loading} pagination={false} size="middle" />

      <Modal
        open={modalOpen}
        title={editing ? 'Chỉnh Sửa Nút' : 'Thêm Nút Mới'}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Lưu' : 'Tạo'}
        confirmLoading={saving}
        okButtonProps={{ style: { background: '#f39221', borderColor: '#f39221' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="label" label="Nhãn hiển thị (tooltip)" rules={[{ required: true }]}>
            <Input placeholder="Zalo Chat" />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}
            help="Phone/Zalo: nhập số điện thoại. Messenger: nhập Page ID. Các loại khác: nhập URL đầy đủ.">
            <Input placeholder="0827972555 hoặc https://..." />
          </Form.Item>
          <Form.Item name="position" label="Vị trí hiển thị">
            <Select options={Object.entries(POSITION_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="order" label="Thứ tự">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="Icon tuỳ chỉnh (không bắt buộc)">
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 12px', border: '1px solid #d9d9d9', borderRadius: 6 }}>
              <UploadOutlined /> Chọn ảnh icon
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
            </label>
            {iconFile && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{iconFile.name}</Text>}
          </Form.Item>
          <Form.Item name="isActive" label="Hiển thị" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
