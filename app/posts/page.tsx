import { Suspense } from 'react';
import PostsContent from './PostsContent';

export default function PostsPage() {
  return (
    <Suspense>
      <PostsContent />
    </Suspense>
  );
}
