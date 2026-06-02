'use client';
import { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { uploadApi } from '@/utils/api';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Props {
  value?: string;
  onChange?: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const quillRef = useRef<{ getEditor: () => { getSelection: (focus?: boolean) => { index: number } | null; insertEmbed: (index: number, type: string, value: string) => void; setSelection: (index: number) => void } } | null>(null);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const { url } = await uploadApi.image(file);

        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection(true);
        if (!range) return;
        editor.insertEmbed(range.index, 'image', url);
        editor.setSelection(range.index + 1);
      } catch {
        alert('Upload ảnh thất bại, thử lại!');
      }
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
  }), []);

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'link', 'image'];

  return (
    <div style={{ minHeight: 300 }}>
      <ReactQuill
        ref={quillRef as never}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={{ height: 400, marginBottom: 42 }}
      />
    </div>
  );
}
