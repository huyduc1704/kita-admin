'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Tabs, Card, Space, Row, Col, Typography, message, Switch, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { systemSettingsApi, uploadApi, SystemSetting } from '@/utils/api';
import { useSetting } from '@/components/providers/SettingProvider';

const { Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Custom form control for image upload
function ImageUploadField({ value, onChange }: { value?: string, onChange?: (val: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const res = await uploadApi.image(file);
      if (onChange) onChange(res.url);
      message.success('Upload ảnh thành công!');
    } catch (e: any) {
      message.error(e.message || 'Lỗi upload ảnh');
    } finally {
      setLoading(false);
    }
    return false; // Prevent default upload behavior
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Input value={value} onChange={e => onChange && onChange(e.target.value)} placeholder="URL hình ảnh" style={{ flex: 1 }} />
      <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
        <Button icon={<UploadOutlined />} loading={loading}>Tải lên</Button>
      </Upload>
      {value && <img src={value} alt="preview" style={{ height: 32, width: 32, objectFit: 'cover', borderRadius: 4 }} />}
    </div>
  );
}

export default function HomePageSettings() {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { setting, refresh } = useSetting();

  useEffect(() => {
    if (setting) {
      const config = setting.homeConfig || {};
      form.setFieldsValue(config);
    }
  }, [setting, form]);

  const onFinish = async (values: any) => {
    // Tự động bóc tách YouTube ID nếu khách hàng dán nguyên cả URL
    if (values.video?.videos?.length) {
      values.video.videos = values.video.videos.map((vid: any) => {
        let yId = vid.youtubeId || '';
        if (yId.includes('youtube.com') || yId.includes('youtu.be')) {
          const match = yId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (match && match[1]) {
            yId = match[1];
          }
        }
        return { ...vid, youtubeId: yId };
      });
    }

    setSaving(true);
    try {
      await systemSettingsApi.update({ homeConfig: values });
      message.success('Đã lưu cấu hình trang chủ!');
      await refresh();
    } catch (e: any) {
      message.error(e.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Cài Đặt Cấu Hình Trang Chủ</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Tabs defaultActiveKey="about" style={{ background: '#fff', padding: '0 20px 20px', borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          
          {/* Tab: Về Chúng Tôi */}
          <TabPane tab="Về Chúng Tôi" key="about">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['about', 'title']} label="Tiêu đề chính">
                  <Input placeholder="VD: VỀ CHÚNG TÔI" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['about', 'subtitle']} label="Tiêu đề phụ">
                  <Input placeholder="VD: CÔNG TY CỔ PHẦN KIẾN TRÚC & XÂY DỰNG GAMMA HOME" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={['about', 'content']} label="Đoạn văn giới thiệu (HTML hoặc Text)">
                  <TextArea rows={4} placeholder="Nhập nội dung giới thiệu..." />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={['about', 'backgroundUrl']} label="Ảnh Nền Background">
                  <ImageUploadField />
                </Form.Item>
              </Col>
            </Row>

            <Card title="Các thẻ Giá trị (Tầm nhìn, Sứ mệnh...)" size="small" style={{ marginTop: 16 }}>
              <Form.List name={['about', 'cards']}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card size="small" key={key} style={{ marginBottom: 16 }} extra={<Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item {...restField} name={[name, 'title']} label="Tiêu đề Thẻ">
                              <Input placeholder="VD: TẦM NHÌN" />
                            </Form.Item>
                          </Col>
                          <Col span={16}>
                            <Form.Item {...restField} name={[name, 'icon']} label="Icon Hình Ảnh">
                              <ImageUploadField />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item {...restField} name={[name, 'desc']} label="Nội dung">
                              <TextArea rows={3} placeholder="Mô tả..." />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm Thẻ</Button>
                  </>
                )}
              </Form.List>
            </Card>
          </TabPane>

          {/* Tab: Double Banner */}
          <TabPane tab="Double Banner" key="doubleBanner">
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Banner Bên Trái" size="small">
                  <Form.Item name={['doubleBanner', 'banner1', 'title']} label="Tiêu đề chính"><Input /></Form.Item>
                  <Form.Item name={['doubleBanner', 'banner1', 'subtitle']} label="Tiêu đề phụ (Bên dưới)"><Input /></Form.Item>
                  <Form.Item name={['doubleBanner', 'banner1', 'text']} label="Dòng chữ nhỏ (Bên trên)"><Input /></Form.Item>
                  <Form.Item name={['doubleBanner', 'banner1', 'imageUrl']} label="Hình nền Banner 1"><ImageUploadField /></Form.Item>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Banner Bên Phải" size="small">
                  <Form.Item name={['doubleBanner', 'banner2', 'title']} label="Tiêu đề chính"><Input /></Form.Item>
                  <Form.Item name={['doubleBanner', 'banner2', 'subtitle']} label="Tiêu đề phụ (Bên dưới)"><Input /></Form.Item>
                  <Form.Item name={['doubleBanner', 'banner2', 'imageUrl']} label="Hình nền Banner 2"><ImageUploadField /></Form.Item>
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* Tab: Lý Do Chọn Chúng Tôi */}
          <TabPane tab="Lý Do Chọn Chúng Tôi" key="whyChooseUs">
            <Form.Item name={['whyChooseUs', 'title']} label="Tiêu Đề Section">
              <Input placeholder="TẠI SAO CHỌN GAMMA HOME" />
            </Form.Item>
            <Form.Item name={['whyChooseUs', 'backgroundUrl']} label="Hình Nền Background">
              <ImageUploadField />
            </Form.Item>
            
            <Form.List name={['whyChooseUs', 'items']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card size="small" key={key} style={{ marginBottom: 16 }} extra={<Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'title']} label="Tiêu đề"><Input /></Form.Item>
                        </Col>
                        <Col span={16}>
                          <Form.Item {...restField} name={[name, 'icon']} label="Icon (Ảnh)"><ImageUploadField /></Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item {...restField} name={[name, 'description']} label="Mô tả chi tiết"><TextArea rows={2} /></Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm Lý Do</Button>
                </>
              )}
            </Form.List>
          </TabPane>

          {/* Tab: Video Khách Hàng */}
          <TabPane tab="Video Khách Hàng" key="video">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name={['video', 'title']} label="Tiêu Đề Section">
                  <Input placeholder="KHÁCH HÀNG NÓI GÌ VỀ GAMMA HOME" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['video', 'defaultChannelTitle']} label="Tên Kênh Mặc Định">
                  <Input placeholder="VD: NHA DEP GAMMA" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['video', 'defaultAvatar']} label="Icon Kênh Mặc Định">
                  <ImageUploadField />
                </Form.Item>
              </Col>
            </Row>

            <Form.List name={['video', 'videos']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card size="small" key={key} style={{ marginBottom: 16 }} title={`Video ${name + 1}`} extra={<Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'youtubeId']} label="Đường dẫn YouTube (URL hoặc ID)">
                            <Input placeholder="VD: https://www.youtube.com/watch?v=e1S9Xm45gXU" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'title']} label="Tên Video"><Input /></Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'channelTitle']} label="Tên Kênh (Bỏ trống sẽ lấy mặc định)">
                            <Input placeholder="Tên kênh riêng biệt (nếu có)" />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'avatar']} label="Icon Kênh (Bỏ trống sẽ lấy mặc định)"><ImageUploadField /></Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item {...restField} name={[name, 'thumbnail']} label="Ảnh Thumbnail (Bỏ trống sẽ tự động lấy từ Youtube)"><ImageUploadField /></Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm Video</Button>
                </>
              )}
            </Form.List>
          </TabPane>

        </Tabs>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={saving} style={{ background: '#f39221', borderColor: '#f39221' }}>
            Lưu Cấu Hình Trang Chủ
          </Button>
        </div>
      </Form>
    </div>
  );
}
