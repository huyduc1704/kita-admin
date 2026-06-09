'use client';
import dynamic from 'next/dynamic';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
}

const Editor = dynamic<Props>(() => import('./CKEditorWrapper'), {
  ssr: false,
  loading: () => <div style={{ minHeight: 400, border: '1px solid #ccc', padding: 20, marginBottom: 42, color: '#999' }}>Đang tải trình soạn thảo...</div>
});

export default function RichTextEditor({ value, onChange }: Props) {
  return <Editor value={value} onChange={onChange} />;
}
