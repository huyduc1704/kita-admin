'use client';
import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { use } from 'react';
import { postsApi, Post } from '@/utils/api';
import PostForm from '@/components/posts/PostForm';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.getOne(+id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin size="large" tip="Đang tải bài viết..." />
      </div>
    );
  }

  if (!post) {
    return <div className="page-card">Không tìm thấy bài viết.</div>;
  }

  return <div className="page-card"><PostForm post={post} /></div>;
}
