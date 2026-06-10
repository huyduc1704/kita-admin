'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Select, Switch, Tag, Space,
  Typography, Image, App, Tabs, Tooltip, Badge,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useRouter, useSearchParams } from 'next/navigation';
import { postsApi, categoriesApi, Post, Category } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  project:   { label: 'Dự Án',     color: 'blue' },
  service:   { label: 'Dịch Vụ',   color: 'purple' },
  about:     { label: 'Giới Thiệu', color: 'magenta' },
  news:      { label: 'Tin Tức',    color: 'green' },
  knowledge: { label: 'Kiến Thức', color: 'cyan' },
  pricing:   { label: 'Báo Giá',   color: 'orange' },
};

const GROUP_BY_TYPE: Record<string, string> = {
  project: 'du-an', service: 'dich-vu', about: 'gioi-thieu', news: 'tin-tuc',
  knowledge: 'kien-thuc', pricing: 'bao-gia',
};

const TAB_ITEMS = [
  { key: '', label: 'Tất cả' },
  ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
];

export default function PostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type') || '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const { message, modal } = App.useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postsApi.getAll({
        type: activeType || undefined,
        search: search || undefined,
        categoryId: categoryFilter,
        page,
        limit: 10,
      });
      setPosts(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [activeType, search, categoryFilter, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const groupSlug = activeType ? GROUP_BY_TYPE[activeType] : undefined;
    categoriesApi.getAll(groupSlug ? { group: groupSlug } : {}).then(setCategories);
  }, [activeType]);

  const handleTabChange = (key: string) => {
    setPage(1);
    setCategoryFilter(undefined);
    setSearch('');
    router.push(key ? `/posts?type=${key}` : '/posts');
  };

  const handleToggle = async (post: Post, checked: boolean) => {
    try {
      await postsApi.togglePublish(post.id);
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, isActive: checked } : p));
    } catch { message.error('Cập nhật thất bại'); }
  };

  const handleDelete = (post: Post) => {
    modal.confirm({
      title: `Xoá bài "${post.title}"?`,
      content: 'Toàn bộ ảnh thumbnail và gallery trên Cloudinary cũng sẽ bị xoá.',
      okType: 'danger', okText: 'Xoá', cancelText: 'Huỷ',
      onOk: async () => {
        await postsApi.remove(post.id);
        message.success('Đã xoá bài viết');
        load();
      },
    });
  };

  const columns: ColumnsType<Post> = [
    {
      title: 'Ảnh', width: 80,
      render: (_, p) => p.thumbnailUrl
        ? <Image src={p.thumbnailUrl} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
        : <div style={{ width: 64, height: 44, background: '#f0f0f0', borderRadius: 4 }} />,
    },
    {
      title: 'Tiêu đề', key: 'title',
      render: (_, p) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{p.title}</Text>
          <code style={{ fontSize: 11, color: '#999' }}>/{p.slug}</code>
          {p.category && <Tag style={{ fontSize: 11 }}>{p.category.name}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Loại', dataIndex: 'type', width: 110,
      render: (t: string) => <Tag color={TYPE_CONFIG[t]?.color}>{TYPE_CONFIG[t]?.label}</Tag>,
    },
    {
      title: 'Views', dataIndex: 'views', width: 70, align: 'center' as const,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', width: 110,
      render: (d: string) => <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>,
    },
    {
      title: 'Hiển thị', width: 80, align: 'center' as const,
      render: (_, p) => <Switch size="small" checked={p.isActive} onChange={(c) => handleToggle(p, c)} />,
    },
    {
      title: '', width: 90, align: 'center' as const,
      render: (_, p) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => router.push(`/posts/${p.id}`)} />
          </Tooltip>
          <Tooltip title="Xoá">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(p)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Bài Viết & Dự Án</Title>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => router.push(`/posts/create${activeType ? `?type=${activeType}` : ''}`)}
          style={{ background: '#f39221', borderColor: '#f39221' }}>
          Thêm Mới
        </Button>
      </div>

      <Tabs
        items={TAB_ITEMS.map((t) => ({
          key: t.key,
          label: activeType === t.key
            ? <span>{t.label} <Badge count={total} style={{ marginLeft: 4, background: '#f39221' }} /></span>
            : t.label,
        }))}
        activeKey={activeType}
        onChange={handleTabChange}
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm theo tiêu đề..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 260 }}
          allowClear
        />
        {activeType !== 'pricing' && (
          <Select
            placeholder="Lọc theo danh mục"
            allowClear
            style={{ width: 220 }}
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        )}
      </Space>

      <Table
        columns={columns}
        dataSource={posts}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          showTotal: (t) => `Tổng ${t} bài`,
          onChange: setPage,
        }}
        size="middle"
      />
    </div>
  );
}
