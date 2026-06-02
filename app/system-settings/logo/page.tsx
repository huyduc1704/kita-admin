'use client';
import { useState } from 'react';
import { Card, Button, Typography, App, Row, Col, Upload } from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { systemSettingsApi } from '@/utils/api';
import { useSetting } from '@/components/providers/SettingProvider';

const { Title, Text } = Typography;

function ImageUploader({
  label, description, currentUrl, onUpload,
}: {
  label: string; description: string; currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(currentUrl || '');
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!file) { message.warning('Vui lòng chọn file'); return; }
    setSaving(true);
    try {
      await onUpload(file);
      message.success(`${label} đã được cập nhật`);
      setFile(null);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Upload thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={label} style={{ height: '100%' }}>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>{description}</Text>

      {preview && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6, display: 'flex', justifyContent: 'center' }}>
          <img src={preview} alt={label} style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{
          padding: '4px 12px', border: '1px solid #d9d9d9', borderRadius: 6,
          cursor: 'pointer', fontSize: 14, background: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <UploadOutlined /> Chọn file
          <input type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
        </label>
        {file && <Text type="secondary" style={{ fontSize: 12 }}>{file.name}</Text>}
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!file}
          style={{ background: '#f39221', borderColor: '#f39221' }}>
          Lưu
        </Button>
      </div>
    </Card>
  );
}

export default function LogoPage() {
  const { setting, refresh } = useSetting();

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Logo & Favicon</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <ImageUploader
            label="Logo công ty"
            description="Hiển thị trên header website và sidebar admin. Khuyến nghị: PNG nền trong, tối thiểu 400px chiều rộng."
            currentUrl={setting?.logoUrl ?? null}
            onUpload={async (file) => { await systemSettingsApi.uploadLogo(file); await refresh(); }}
          />
        </Col>
        <Col xs={24} md={12}>
          <ImageUploader
            label="Favicon"
            description="Icon nhỏ hiển thị trên tab trình duyệt. Khuyến nghị: ICO hoặc PNG 32x32px."
            currentUrl={setting?.faviconUrl ?? null}
            onUpload={async (file) => { await systemSettingsApi.uploadFavicon(file); await refresh(); }}
          />
        </Col>
        <Col xs={24} md={12}>
          <ImageUploader
            label="Ảnh Section Phản Hồi"
            description="Ảnh nền cho phần video testimonials trang chủ."
            currentUrl={setting?.feedbackImageUrl ?? null}
            onUpload={async (file) => { await systemSettingsApi.uploadFeedbackImage(file); await refresh(); }}
          />
        </Col>
      </Row>
    </div>
  );
}
