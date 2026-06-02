'use client';
import { useEffect, useState } from 'react';
import {
  Row, Col, Card, List, Badge, Button, Table, Switch,
  Modal, Form, Input, App, Tooltip, Space, Typography, Tag, Empty,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { categoriesApi, Group, Category } from '@/utils/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CategoriesPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingCats, setLoadingCats] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  // ─── Load groups ────────────────────────────────────────────────────────

  useEffect(() => {
    categoriesApi.getGroups()
      .then((data) => {
        setGroups(data);
        if (data.length > 0) setSelectedGroup(data[0]);
      })
      .finally(() => setLoadingGroups(false));
  }, []);

  // ─── Load categories khi đổi group ───────────────────────────────────────

  useEffect(() => {
    if (!selectedGroup) return;
    setLoadingCats(true);
    categoriesApi.getAll({ groupId: selectedGroup.id })
      .then(setCategories)
      .finally(() => setLoadingCats(false));
  }, [selectedGroup]);

  const reloadCategories = () => {
    if (!selectedGroup) return;
    setLoadingCats(true);
    categoriesApi.getAll({ groupId: selectedGroup.id })
      .then(setCategories)
      .finally(() => setLoadingCats(false));
  };

  const reloadGroups = () => {
    categoriesApi.getGroups().then(setGroups);
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setThumbFile(null);
    setThumbPreview('');
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setThumbFile(null);
    setThumbPreview(cat.thumbnailUrl || '');
    form.setFieldsValue({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  // Auto generate slug từ name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editing) return; // khi edit không tự đổi slug
    const slug = e.target.value
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    form.setFieldValue('slug', slug);
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSave = async (values: { name: string; slug: string; description?: string; isActive: boolean }) => {
    if (!selectedGroup) return;
    setSaving(true);
    try {
      if (editing) {
        await categoriesApi.update(editing.id, values);
        if (thumbFile) await categoriesApi.uploadThumbnail(editing.id, thumbFile);
        message.success('Cập nhật danh mục thành công');
      } else {
        const created = await categoriesApi.create({
          ...values,
          groupId: selectedGroup.id,
          order: categories.length,
        });
        if (thumbFile) await categoriesApi.uploadThumbnail(created.id, thumbFile);
        message.success('Tạo danh mục thành công');
      }
      setModalOpen(false);
      reloadCategories();
      reloadGroups();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: Category, checked: boolean) => {
    try {
      await categoriesApi.update(cat.id, { isActive: checked });
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isActive: checked } : c));
    } catch { message.error('Cập nhật thất bại'); }
  };

  const handleDelete = (cat: Category) => {
    modal.confirm({
      title: `Xoá danh mục "${cat.name}"?`,
      content: 'Các bài viết thuộc danh mục này sẽ mất liên kết. Hành động không thể hoàn tác.',
      okType: 'danger', okText: 'Xoá', cancelText: 'Huỷ',
      onOk: async () => {
        await categoriesApi.remove(cat.id);
        message.success('Đã xoá danh mục');
        reloadCategories();
        reloadGroups();
      },
    });
  };

  const moveOrder = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    await categoriesApi.reorder(reordered.map((c, i) => ({ id: c.id, order: i })));
    reloadCategories();
  };

  // ─── Table columns ────────────────────────────────────────────────────────

  const columns: ColumnsType<Category> = [
    {
      title: 'Ảnh', width: 70,
      render: (_, cat) => cat.thumbnailUrl
        ? <img src={cat.thumbnailUrl} alt={cat.name} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
        : <div style={{ width: 48, height: 36, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PictureOutlined style={{ color: '#bbb' }} />
          </div>,
    },
    {
      title: 'Tên danh mục', key: 'name',
      render: (_, cat) => (
        <Space direction="vertical" size={2}>
          <strong>{cat.name}</strong>
          <code style={{ fontSize: 11, color: '#888', background: '#f5f5f5', padding: '1px 6px', borderRadius: 3 }}>
            /{cat.slug}
          </code>
          {cat.description && <Text type="secondary" style={{ fontSize: 12 }}>{cat.description}</Text>}
        </Space>
      ),
    },
    {
      title: 'Thứ tự', key: 'order', width: 90, align: 'center',
      render: (_, __, idx) => (
        <Space>
          <Button size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => moveOrder(idx, -1)} />
          <Button size="small" icon={<ArrowDownOutlined />} disabled={idx === categories.length - 1} onClick={() => moveOrder(idx, 1)} />
        </Space>
      ),
    },
    {
      title: 'Hiển thị', width: 90, align: 'center',
      render: (_, cat) => <Switch checked={cat.isActive} onChange={(c) => handleToggle(cat, c)} />,
    },
    {
      title: 'Thao tác', width: 100, align: 'center',
      render: (_, cat) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(cat)} />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(cat)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Quản Lý Danh Mục</Title>
      </div>

      <Row gutter={16}>
        {/* Sidebar — Groups */}
        <Col xs={24} md={6}>
          <Card title="Nhóm Menu" size="small" loading={loadingGroups}
            style={{ position: 'sticky', top: 24 }}>
            <List
              dataSource={groups}
              renderItem={(group) => (
                <List.Item
                  onClick={() => setSelectedGroup(group)}
                  style={{
                    cursor: 'pointer',
                    padding: '10px 12px',
                    borderRadius: 6,
                    marginBottom: 4,
                    background: selectedGroup?.id === group.id ? '#fff7e6' : 'transparent',
                    borderLeft: selectedGroup?.id === group.id ? '3px solid #f39221' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text strong={selectedGroup?.id === group.id} style={{ color: selectedGroup?.id === group.id ? '#f39221' : '#333' }}>
                      {group.name}
                    </Text>
                    <Badge count={group.categoryCount} showZero
                      style={{ background: selectedGroup?.id === group.id ? '#f39221' : '#d9d9d9' }} />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Content — Categories */}
        <Col xs={24} md={18}>
          <Card
            title={
              <Space>
                <span>Danh mục trong:</span>
                {selectedGroup && <Tag color="orange">{selectedGroup.name}</Tag>}
              </Space>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
                disabled={!selectedGroup}
                style={{ background: '#f39221', borderColor: '#f39221' }}>
                Thêm Danh Mục
              </Button>
            }
            size="small"
          >
            {categories.length === 0 && !loadingCats
              ? <Empty description="Chưa có danh mục nào. Nhấn «Thêm Danh Mục» để bắt đầu." style={{ padding: '32px 0' }} />
              : <Table
                  columns={columns}
                  dataSource={categories}
                  rowKey="id"
                  loading={loadingCats}
                  pagination={false}
                  size="middle"
                />
            }
          </Card>
        </Col>
      </Row>

      {/* Modal tạo / chỉnh sửa */}
      <Modal
        open={modalOpen}
        title={
          <Space>
            {editing ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
            {selectedGroup && <Tag color="orange">{selectedGroup?.name}</Tag>}
          </Space>
        }
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Lưu' : 'Tạo'}
        confirmLoading={saving}
        width={540}
        okButtonProps={{ style: { background: '#f39221', borderColor: '#f39221' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Xây Nhà Trọn Gói" onChange={handleNameChange} />
          </Form.Item>

          <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true, message: 'Vui lòng nhập slug' }]}
            help="Dùng trong URL, chỉ gồm chữ thường, số và dấu gạch ngang">
            <Input placeholder="xay-nha-tron-goi" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả ngắn">
            <TextArea rows={2} placeholder="Mô tả về danh mục này..." />
          </Form.Item>

          <Form.Item label={editing ? 'Thay ảnh thumbnail (bỏ qua nếu không đổi)' : 'Ảnh thumbnail'}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              padding: '4px 12px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fafafa',
            }}>
              <PictureOutlined /> Chọn ảnh
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbChange} />
            </label>
            {thumbPreview && (
              <img src={thumbPreview} alt="preview"
                style={{ display: 'block', marginTop: 8, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #f0f0f0' }} />
            )}
          </Form.Item>

          <Form.Item name="isActive" label="Hiển thị" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
