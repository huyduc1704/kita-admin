import { Suspense } from 'react';
import CreatePostContent from './CreatePostContent';

export default function CreatePostPage() {
  return (
    <Suspense>
      <CreatePostContent />
    </Suspense>
  );
}
