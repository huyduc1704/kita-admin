'use client';
import { CKEditor } from '@ckeditor/ckeditor5-react';
// @ts-expect-error Types missing in older versions
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { uploadApi } from '@/utils/api';

function MyCustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return {
      upload: () => loader.file.then((file: File) => uploadApi.image(file).then(({ url }) => ({ default: url }))),
    };
  };
}

export default function Editor({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="ckeditor-wrapper" style={{ marginBottom: 42 }}>
      <style>{`
        .ck-editor__editable_inline {
            min-height: 400px;
            word-wrap: break-word !important;
            word-break: break-word !important;
            white-space: pre-wrap !important;
        }
      `}</style>
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        onChange={(event, editor) => {
          const data = editor.getData();
          if (onChange) onChange(data);
        }}
        config={{
          extraPlugins: [MyCustomUploadAdapterPlugin],
          toolbar: [
            'heading', '|',
            'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
            'insertTable', 'tableColumn', 'tableRow', 'mergeTableCells', '|',
            'uploadImage', 'mediaEmbed', '|',
            'undo', 'redo'
          ],
        }}
      />
    </div>
  );
}
