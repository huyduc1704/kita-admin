'use client';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { uploadApi } from '@/utils/api';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface Props {
  value?: string;
  onChange?: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: function (this: { quill: { getSelection: (focus: boolean) => { index: number } | null; insertEmbed: (index: number, type: string, value: string) => void; setSelection: (index: number) => void } }) {
          const quill = this.quill;
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
              const { url } = await uploadApi.image(file);
              const range = quill.getSelection(true);
              if (!range) return;
              quill.insertEmbed(range.index, 'image', url);
              quill.setSelection(range.index + 1);
            } catch {
              alert('Upload ảnh thất bại, thử lại!');
            }
          };
        },
      },
    },
  }), []);

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'link', 'image'];

  return (
    <div style={{ minHeight: 300 }}>
      <ReactQuill
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
