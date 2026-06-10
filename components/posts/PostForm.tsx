'use client';
import { useEffect, useState } from 'react';
import {
  Form, Input, Select, Switch, Button, Card, Row, Col,
  App, Tag, Space, Typography, Divider, InputNumber,
} from 'antd';
import RichTextEditor from './RichTextEditor';
import {
  SaveOutlined, PictureOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { postsApi, categoriesApi, Post, Category, Group } from '@/utils/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: 'project',   label: '🏗️ Dự Án' },
  { value: 'service',   label: '🔧 Dịch Vụ' },
  { value: 'about',     label: '🏢 Giới Thiệu' },
  { value: 'news',      label: '📰 Tin Tức' },
  { value: 'knowledge', label: '📚 Kiến Thức' },
  { value: 'pricing',   label: '💰 Báo Giá' },
];

const GROUP_BY_TYPE: Record<string, string> = {
  project: 'du-an', service: 'dich-vu', about: 'gioi-thieu', news: 'tin-tuc',
  knowledge: 'kien-thuc', pricing: 'bao-gia',
};

interface Props {
  post?: Post;
  defaultType?: string;
}

export default function PostForm({ post, defaultType }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState(post?.type || defaultType || 'project');
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState(post?.thumbnailUrl || '');
  const [gallery, setGallery] = useState<string[]>(post?.gallery || []);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const { message } = App.useApp();
  const router = useRouter();

  // Load categories theo type
  useEffect(() => {
    const groupSlug = GROUP_BY_TYPE[type];
    if (groupSlug) {
      categoriesApi.getAll({ group: groupSlug }).then(setCategories);
    } else {
      setCategories([]);
    }
  }, [type]);

  // Fill form khi edit
  useEffect(() => {
    if (post) {
      form.setFieldsValue({
        type: post.type,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId,
        order: post.order,
        isActive: post.isActive,
        // metadata project
        client: (post.metadata as Record<string, string>)?.client,
        location: (post.metadata as Record<string, string>)?.location,
        scale: (post.metadata as Record<string, string>)?.scale,
        area: (post.metadata as Record<string, string>)?.area,
        year: (post.metadata as Record<string, string>)?.year,
        // metadata service
        features: (post.metadata as Record<string, string[]>)?.features?.join('\n'),
      });
    } else {
      form.setFieldsValue({ type: defaultType || 'project', isActive: true, order: 0 });
    }
  }, [post, form, defaultType]);

  // Auto slug từ title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (post) return;
    const slug = e.target.value
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
    form.setFieldValue('slug', slug);
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!post?.id) { message.warning('Hãy lưu bài viết trước khi thêm gallery'); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setGalleryUploading(true);
    try {
      const updated = await postsApi.addGallery(post.id, file);
      setGallery(updated.gallery);
      message.success('Thêm ảnh gallery thành công');
    } catch { message.error('Upload thất bại'); }
    finally { setGalleryUploading(false); }
  };

  const handleRemoveGallery = async (index: number) => {
    if (!post?.id) return;
    try {
      const updated = await postsApi.removeGallery(post.id, index);
      setGallery(updated.gallery);
      message.success('Đã xoá ảnh');
    } catch { message.error('Xoá thất bại'); }
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      // Build metadata
      let metadata: string | undefined;
      if (type === 'project') {
        metadata = JSON.stringify({
          client: values.client, location: values.location,
          scale: values.scale, area: values.area, year: values.year,
        });
      } else if (type === 'service' && values.features) {
        const features = (values.features as string).split('\n').map((s: string) => s.trim()).filter(Boolean);
        metadata = JSON.stringify({ features });
      }

      type PostPayload = {
        type: Post['type']; title: string; slug: string;
        excerpt?: string; content?: string; categoryId?: number;
        order?: number; isActive: boolean; metadata?: string;
      };

      const payload: PostPayload = {
        type: values.type as Post['type'],
        title: values.title as string,
        slug: values.slug as string,
        excerpt: values.excerpt as string | undefined,
        content: values.content as string | undefined,
        categoryId: values.categoryId as number | undefined,
        order: values.order as number | undefined,
        isActive: values.isActive as boolean,
        metadata,
      };

      if (post) {
        await postsApi.update(post.id, payload as Parameters<typeof postsApi.update>[1]);
        if (thumbFile) await postsApi.updateThumbnail(post.id, thumbFile);
        message.success('Cập nhật thành công');
      } else {
        await postsApi.create(payload as Parameters<typeof postsApi.create>[0], thumbFile || undefined);
        message.success('Tạo bài viết thành công');
        router.push('/posts');
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>{post ? 'Chỉnh Sửa Bài Viết' : 'Thêm Bài Viết Mới'}</Title>
        <Space>
          <Button onClick={() => router.back()}>Quay lại</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}
            style={{ background: '#f39221', borderColor: '#f39221' }}>
            {post ? 'Lưu Thay Đổi' : 'Tạo Bài Viết'}
          </Button>
        </Space>
      </div>

      <Row gutter={20}>
        {/* ── Cột trái: nội dung chính ── */}
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 16 }}>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
              <Input placeholder="Nhà Phố Hiện Đại 8x28m - Anh Nghĩa" onChange={handleTitleChange} size="large" />
            </Form.Item>

            <Form.Item name="slug" label="Slug (URL)" rules={[{ required: true }]}
              help="Tự động tạo từ tiêu đề, có thể chỉnh sửa thủ công">
              <Input prefix={<Text type="secondary">/</Text>} placeholder="nha-pho-hien-dai-8x28m" />
            </Form.Item>

            <Form.Item name="excerpt" label="Mô tả ngắn (excerpt)">
              <TextArea rows={3} placeholder="Tóm tắt ngắn về bài viết, hiển thị trên trang danh sách..." />
            </Form.Item>

            <Form.Item name="content" label="Nội dung chi tiết">
              <RichTextEditor />
            </Form.Item>
          </Card>

          {/* Metadata đặc thù cho Project */}
          {type === 'project' && (
            <Card title="Thông Tin Dự Án" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="client" label="Chủ đầu tư">
                    <Input placeholder="Anh Nghĩa" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="location" label="Địa điểm">
                    <Input placeholder="Bình Phước" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="scale" label="Quy mô">
                    <Input placeholder="2 Tầng, 1 Tum" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="area" label="Diện tích">
                    <Input placeholder="224 m²" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="year" label="Năm hoàn thành">
                    <Input placeholder="2025" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* Metadata cho Service */}
          {type === 'service' && (
            <Card title="Tính Năng Dịch Vụ" style={{ marginBottom: 16 }}>
              <Form.Item name="features" label="Danh sách tính năng"
                help="Mỗi tính năng một dòng">
                <TextArea rows={6} placeholder={"Thiết kế theo yêu cầu\nTư vấn miễn phí\nBảo hành 12 tháng"} />
              </Form.Item>
            </Card>
          )}

          {/* Gallery — chỉ hiển thị khi edit project */}
          {type === 'project' && post && (
            <Card title={<Space>Gallery ảnh <Tag>{gallery.length} ảnh</Tag></Space>} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {gallery.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={url} alt={`gallery-${idx}`}
                      style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }} />
                    <Button
                      size="small" danger icon={<DeleteOutlined />}
                      onClick={() => handleRemoveGallery(idx)}
                      style={{ position: 'absolute', top: 2, right: 2, padding: '0 4px', height: 20, fontSize: 10 }}
                    />
                  </div>
                ))}
              </div>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: galleryUploading ? 'wait' : 'pointer',
                padding: '6px 14px', border: '1px dashed #d9d9d9', borderRadius: 6, color: '#666',
              }}>
                <PlusOutlined /> {galleryUploading ? 'Đang upload...' : 'Thêm ảnh vào gallery'}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={handleAddGallery} disabled={galleryUploading} />
              </label>
              <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                * Lưu bài viết trước, sau đó mới upload gallery
              </Text>
            </Card>
          )}
        </Col>

        {/* ── Cột phải: sidebar cài đặt ── */}
        <Col xs={24} lg={8}>
          <Card title="Phân Loại" style={{ marginBottom: 16 }}>
            <Form.Item name="type" label="Loại bài viết" rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS} onChange={(v) => { setType(v); form.setFieldValue('categoryId', undefined); }} />
            </Form.Item>

            {type !== 'pricing' && (
              <Form.Item name="categoryId" label="Danh mục">
                <Select
                  placeholder="Chọn danh mục..."
                  allowClear
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  notFoundContent={<Text type="secondary">Chưa có danh mục cho loại này</Text>}
                />
              </Form.Item>
            )}

            <Form.Item name="order" label="Thứ tự hiển thị">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
            </Form.Item>
          </Card>

          <Card title="Ảnh Thumbnail" style={{ marginBottom: 16 }}>
            {thumbPreview && (
              <img src={thumbPreview} alt="thumbnail"
                style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 10, border: '1px solid #f0f0f0' }} />
            )}
            <label style={{
              display: 'block', textAlign: 'center', padding: '10px',
              border: '1px dashed #d9d9d9', borderRadius: 6, cursor: 'pointer', color: '#666',
            }}>
              <PictureOutlined style={{ marginRight: 6 }} />
              {thumbPreview ? 'Thay ảnh thumbnail' : 'Chọn ảnh thumbnail'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleThumbChange} />
            </label>
            {thumbFile && <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>{thumbFile.name}</Text>}
          </Card>

          {type === 'project' && !post && (
            <Card size="small" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
              <Text style={{ fontSize: 12 }}>
                💡 Sau khi tạo dự án, vào trang chỉnh sửa để upload thêm ảnh gallery.
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </Form>
  );
}
