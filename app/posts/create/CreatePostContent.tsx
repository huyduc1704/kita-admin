'use client';
import { useSearchParams } from 'next/navigation';
import PostForm from '@/components/posts/PostForm';

export default function CreatePostContent() {
  const params = useSearchParams();
  const defaultType = params.get('type') || 'project';
  return <div className="page-card"><PostForm defaultType={defaultType} /></div>;
}
