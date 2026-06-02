'use client';
import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Badge, List, Tag } from 'antd';
import { FileTextOutlined, PhoneOutlined, PictureOutlined, AppstoreOutlined } from '@ant-design/icons';
import { leadsApi, LeadStats, ConsultationLead } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  new: 'blue', contacted: 'orange', consulting: 'purple', done: 'green', cancelled: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  new: 'Mới', contacted: 'Đã liên hệ', consulting: 'Đang tư vấn', done: 'Hoàn thành', cancelled: 'Huỷ',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<ConsultationLead[]>([]);

  useEffect(() => {
    leadsApi.getStats().then(setStats).catch(() => {});
    leadsApi.getAll({ limit: 5 }).then((r) => setRecentLeads(r.items)).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <Title level={4} style={{ marginBottom: 20 }}>Bảng Điều Khiển</Title>

      {/* Stats row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng Form Tư Vấn"
              value={stats?.total ?? '-'}
              prefix={<PhoneOutlined style={{ color: '#f39221' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Form Hôm Nay"
              value={stats?.today ?? '-'}
              prefix={<Badge color="green" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Chờ Xử Lý"
              value={stats?.byStatus?.new ?? '-'}
              prefix={<Badge color="blue" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Hoàn Thành"
              value={stats?.byStatus?.done ?? '-'}
              prefix={<Badge color="green" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick links + Recent leads */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Truy Cập Nhanh" size="small">
            {[
              { href: '/hero-slides', icon: <PictureOutlined />, label: 'Quản lý Hero Slides' },
              { href: '/categories', icon: <AppstoreOutlined />, label: 'Quản lý Danh Mục' },
              { href: '/posts?type=project', icon: <FileTextOutlined />, label: 'Quản lý Dự Án' },
              { href: '/consultation-leads', icon: <PhoneOutlined />, label: 'Xem Form Tư Vấn' },
            ].map((item) => (
              <a key={item.href} href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f0f0f0', color: '#333', textDecoration: 'none' }}>
                <span style={{ color: '#f39221' }}>{item.icon}</span>
                <Text>{item.label}</Text>
              </a>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Form Tư Vấn Mới Nhất" size="small">
            <List
              dataSource={recentLeads}
              locale={{ emptyText: 'Chưa có form nào' }}
              renderItem={(lead) => (
                <List.Item
                  extra={<Tag color={STATUS_COLOR[lead.status]}>{STATUS_LABEL[lead.status]}</Tag>}
                >
                  <List.Item.Meta
                    title={<a href="/consultation-leads">{lead.name} — {lead.phone}</a>}
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {lead.province || 'N/A'} · {dayjs(lead.createdAt).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
