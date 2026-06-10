'use client';
import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, App, Divider, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { systemSettingsApi, SystemSetting } from '@/utils/api';
import { useSetting } from '@/components/providers/SettingProvider';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function GeneralSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { setting, refresh } = useSetting();
  const { message } = App.useApp();

  useEffect(() => {
    if (setting) {
      form.setFieldsValue({
        companyName: setting.companyName,
        taxCode: setting.taxCode,
        slogan: setting.slogan,
        hotline: setting.hotline,
        email: setting.email,
        addressNorth: setting.addressNorth,
        addressSouth: setting.addressSouth,
        footerDescription: setting.footerDescription,
        footerCopyright: setting.footerCopyright,
        footerFanpageUrl: setting.footerFanpageUrl,
      });
    }
  }, [setting, form]);

  const handleSave = async (values: Partial<SystemSetting>) => {
    setSaving(true);
    try {
      await systemSettingsApi.update(values);
      await refresh();
      message.success('Lưu cài đặt thành công');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Footer</Title>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Thông Tin Công Ty" style={{ marginBottom: 16 }}>
              <Form.Item name="companyName" label="Tên công ty" rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}>
                <Input placeholder="GAMMA HOME" />
              </Form.Item>
              <Form.Item name="taxCode" label="Mã số thuế">
                <Input placeholder="0123456789" />
              </Form.Item>
              <Form.Item name="slogan" label="Slogan">
                <Input placeholder="Kiến tạo không gian sống" />
              </Form.Item>
            </Card>

            <Card title="Liên Hệ">
              <Form.Item name="hotline" label="Hotline">
                <Input placeholder="0827.972.555" />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input placeholder="info@gammahome.vn" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Địa Chỉ" style={{ marginBottom: 16 }}>
              <Form.Item name="addressNorth" label="Địa chỉ Miền Bắc">
                <TextArea rows={3} placeholder="G29-30 Ngô Thì Nhậm, Hà Đông, Hà Nội" />
              </Form.Item>
              <Form.Item name="addressSouth" label="Địa chỉ Miền Nam">
                <TextArea rows={3} placeholder="Đường T2-41 Vinhomes Grand Park, TP.Thủ Đức, HCM" />
              </Form.Item>
            </Card>

            <Card title="Chân Trang (Footer)">
              <Form.Item name="footerDescription" label="Đoạn giới thiệu ngắn">
                <TextArea rows={4} placeholder="GAMMA HOME là đơn vị thiết kế và thi công nhà trọn gói..." />
              </Form.Item>
              <Form.Item name="footerCopyright" label="Bản quyền (Copyright)">
                <Input placeholder="© 2021 Bản quyền thuộc về Gamma Home." />
              </Form.Item>
              <Form.Item name="footerFanpageUrl" label="Đường dẫn Fanpage Facebook" help="Bỏ trống sẽ tự động hiển thị Fanpage mặc định từ cấu hình Mạng Xã Hội">
                <Input placeholder="https://www.facebook.com/nhadepgamma" />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}
            size="large" style={{ background: '#f39221', borderColor: '#f39221' }}>
            Lưu Thay Đổi
          </Button>
        </div>
      </Form>
    </div>
  );
}
