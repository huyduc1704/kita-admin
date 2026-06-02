'use client';
import { useEffect, useState } from 'react';
import {
  Button, Table, Switch, Space, Image, Typography,
  Modal, Form, InputNumber, App, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  PictureOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { heroSlidesApi, HeroSlide } from '@/utils/api';

const { Title } = Typography;

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message, modal } = App.useApp();

  const load = () => {
    setLoading(true);
    heroSlidesApi.getAll().then(setSlides).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview('');
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setImageFile(null);
    setImagePreview(slide.imageUrl);
    form.setFieldsValue(slide);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (values: Partial<HeroSlide>) => {
    if (!editing && !imageFile) { message.warning('Vui lòng chọn ảnh cho slide'); return; }
    setSaving(true);
    try {
      if (editing) {
        await heroSlidesApi.update(editing.id, values);
        if (imageFile) await heroSlidesApi.updateImage(editing.id, imageFile);
        message.success('Cập nhật slide thành công');
      } else {
        await heroSlidesApi.create(values, imageFile!);
        message.success('Tạo slide thành công');
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (slide: HeroSlide, checked: boolean) => {
    try {
      await heroSlidesApi.update(slide.id, { isActive: checked });
      setSlides((prev) => prev.map((s) => s.id === slide.id ? { ...s, isActive: checked } : s));
    } catch { message.error('Cập nhật thất bại'); }
  };

  const handleDelete = (slide: HeroSlide) => {
    modal.confirm({
      title: 'Xoá slide này?',
      content: `"${slide.title || 'Slide #' + slide.id}" sẽ bị xoá vĩnh viễn kèm ảnh trên Cloudinary.`,
      okType: 'danger',
      okText: 'Xoá',
      cancelText: 'Huỷ',
      onOk: async () => {
        await heroSlidesApi.remove(slide.id);
        message.success('Đã xoá slide');
        load();
      },
    });
  };

  const moveOrder = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    const items = reordered.map((s, i) => ({ id: s.id, order: i }));
    await heroSlidesApi.reorder(items);
    load();
  };

  const columns: ColumnsType<HeroSlide> = [
    {
      title: 'Ảnh', dataIndex: 'imageUrl', width: 100,
      render: (url: string) => <Image src={url} width={80} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} preview={{ mask: <PictureOutlined /> }} />,
    },
    {
      title: 'Thứ tự', key: 'order', width: 90, align: 'center',
      render: (_, s, idx) => (
        <Space>
          <Button size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => moveOrder(idx, -1)} />
          <Button size="small" icon={<ArrowDownOutlined />} disabled={idx === slides.length - 1} onClick={() => moveOrder(idx, 1)} />
        </Space>
      ),
    },
    {
      title: 'Hiển thị', dataIndex: 'isActive', width: 90, align: 'center',
      render: (v: boolean, s) => <Switch checked={v} onChange={(c) => handleToggle(s, c)} />,
    },
    {
      title: 'Thao tác', key: 'action', width: 100, align: 'center',
      render: (_, s) => (
        <Space>
          <Tooltip title="Chỉnh sửa"><Button size="small" icon={<EditOutlined />} onClick={() => openEdit(s)} /></Tooltip>
          <Tooltip title="Xoá"><Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(s)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Hero Slides</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ background: '#f39221', borderColor: '#f39221' }}>
          Thêm Slide
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={slides}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Chỉnh Sửa Slide' : 'Thêm Slide Mới'}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editing ? 'Lưu' : 'Tạo'}
        confirmLoading={saving}
        width={600}
        okButtonProps={{ style: { background: '#f39221', borderColor: '#f39221' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          {/* Image upload */}
          <Form.Item label={editing ? 'Thay ảnh (bỏ qua nếu không đổi)' : 'Ảnh slide *'}>
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginBottom: 8 }} />
            {imagePreview && (
              <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 6, marginTop: 8 }} />
            )}
          </Form.Item>

          <Form.Item name="order" label="Thứ tự">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Hiển thị" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
