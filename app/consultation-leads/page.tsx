'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Table, Tag, Button, Input, Select, Space, Typography,
  App, Drawer, Descriptions, Badge, Row, Col, Card,
  Statistic, Form, Timeline,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, PhoneOutlined,
  CheckCircleOutlined, ClockCircleOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { leadsApi, ConsultationLead, LeadStats } from '@/utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new:        { label: 'Mới',          color: 'blue',    icon: <ClockCircleOutlined /> },
  contacted:  { label: 'Đã liên hệ',  color: 'orange',  icon: <PhoneOutlined /> },
  consulting: { label: 'Đang tư vấn', color: 'purple',  icon: <ClockCircleOutlined /> },
  done:       { label: 'Hoàn thành',  color: 'green',   icon: <CheckCircleOutlined /> },
  cancelled:  { label: 'Huỷ',         color: 'default', icon: <DeleteOutlined /> },
};

const REQUIREMENT_LABEL: Record<string, string> = {
  build: 'Xây nhà trọn gói', design: 'Thiết kế kiến trúc',
  interior: 'Thiết kế nội thất', consult: 'Tư vấn chung',
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([v, c]) => ({
  value: v, label: <Tag color={c.color}>{c.label}</Tag>,
}));

export default function ConsultationLeadsPage() {
  const [leads, setLeads] = useState<ConsultationLead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Drawer xem chi tiết + cập nhật
  const [selected, setSelected] = useState<ConsultationLead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusForm] = Form.useForm();

  const { message, modal } = App.useApp();

  const loadStats = () => leadsApi.getStats().then(setStats).catch(() => {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leadsApi.getAll({
        status: statusFilter,
        search: search || undefined,
        page,
        limit: 15,
      });
      setLeads(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => { load(); loadStats(); }, [load]);

  const openDetail = (lead: ConsultationLead) => {
    setSelected(lead);
    statusForm.setFieldsValue({
      status: lead.status,
      adminNote: lead.adminNote,
      assignedTo: lead.assignedTo,
    });
    setDrawerOpen(true);
  };

  const handleUpdateStatus = async (values: {
    status: string; adminNote?: string; assignedTo?: string;
  }) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await leadsApi.updateStatus(selected.id, values);
      setSelected(updated);
      setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l));
      loadStats();
      message.success('Cập nhật trạng thái thành công');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = (lead: ConsultationLead) => {
    modal.confirm({
      title: `Xoá form của "${lead.name}"?`,
      okType: 'danger', okText: 'Xoá', cancelText: 'Huỷ',
      onOk: async () => {
        await leadsApi.remove(lead.id);
        message.success('Đã xoá');
        load();
        loadStats();
        if (selected?.id === lead.id) setDrawerOpen(false);
      },
    });
  };

  const columns: ColumnsType<ConsultationLead> = [
    {
      title: 'Khách hàng', key: 'customer',
      render: (_, l) => (
        <Space direction="vertical" size={2}>
          <Text strong>{l.name}</Text>
          <Text type="secondary" copyable style={{ fontSize: 12 }}>{l.phone}</Text>
          {l.email && <Text type="secondary" style={{ fontSize: 11 }}>{l.email}</Text>}
        </Space>
      ),
    },
    {
      title: 'Nhu cầu', key: 'req', width: 160,
      render: (_, l) => (
        <Space direction="vertical" size={2}>
          {l.requirement && <Tag color="blue" style={{ fontSize: 11 }}>{REQUIREMENT_LABEL[l.requirement]}</Tag>}
          {l.province && <Text type="secondary" style={{ fontSize: 12 }}>📍 {l.province}</Text>}
          {l.area && <Text type="secondary" style={{ fontSize: 12 }}>📐 {l.area}</Text>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 130,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s];
        return <Tag color={cfg?.color}>{cfg?.icon} {cfg?.label}</Tag>;
      },
    },
    {
      title: 'Phụ trách', dataIndex: 'assignedTo', width: 120,
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Ngày gửi', dataIndex: 'createdAt', width: 110,
      render: (d: string) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(d).format('HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: '', width: 90, align: 'center' as const,
      render: (_, l) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(l)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(l)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Stats */}
      {stats && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Col key={key} xs={12} sm={8} lg={4}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title={<Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>}
                  value={stats.byStatus[key] ?? 0}
                  valueStyle={{ fontSize: 22, color: key === 'new' ? '#1890ff' : key === 'done' ? '#52c41a' : undefined }}
                />
              </Card>
            </Col>
          ))}
          <Col xs={12} sm={8} lg={4}>
            <Card size="small" style={{ textAlign: 'center', background: '#fffbe6' }}>
              <Statistic title="Hôm nay" value={stats.today} valueStyle={{ fontSize: 22, color: '#f39221' }} />
            </Card>
          </Col>
        </Row>
      )}

      <div className="page-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Form Tư Vấn <Badge count={total} style={{ background: '#f39221', marginLeft: 8 }} /></Title>
        </div>

        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Tìm tên hoặc SĐT..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="Lọc trạng thái"
            allowClear
            style={{ width: 180 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={STATUS_OPTIONS}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={leads}
          rowKey="id"
          loading={loading}
          pagination={{ current: page, total, pageSize: 15, showTotal: (t) => `Tổng ${t} form`, onChange: setPage }}
          size="middle"
          onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        />
      </div>

      {/* Drawer chi tiết */}
      <Drawer
        title={
          <Space>
            <span>Chi tiết form</span>
            {selected && <Tag color={STATUS_CONFIG[selected.status]?.color}>{STATUS_CONFIG[selected.status]?.label}</Tag>}
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={selected && <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(selected)}>Xoá</Button>}
      >
        {selected && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Họ tên">{selected.name}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <a href={`tel:${selected.phone}`}>{selected.phone}</a>
              </Descriptions.Item>
              {selected.email && <Descriptions.Item label="Email">{selected.email}</Descriptions.Item>}
              {selected.requirement && (
                <Descriptions.Item label="Nhu cầu">{REQUIREMENT_LABEL[selected.requirement]}</Descriptions.Item>
              )}
              {selected.province && <Descriptions.Item label="Tỉnh/Thành">{selected.province}</Descriptions.Item>}
              {selected.area && <Descriptions.Item label="Diện tích">{selected.area}</Descriptions.Item>}
              {selected.detailNote && <Descriptions.Item label="Ghi chú của khách">{selected.detailNote}</Descriptions.Item>}
              <Descriptions.Item label="Ngày gửi">{dayjs(selected.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            </Descriptions>

            <Title level={5}>Cập Nhật Xử Lý</Title>
            <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
              <Form.Item name="assignedTo" label="Nhân viên phụ trách">
                <Input placeholder="Tên nhân viên..." />
              </Form.Item>
              <Form.Item name="adminNote" label="Ghi chú nội bộ">
                <TextArea rows={3} placeholder="Đã gọi điện lúc 10h, khách đang cân nhắc..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={updating} block
                style={{ background: '#f39221', borderColor: '#f39221' }}>
                Lưu Cập Nhật
              </Button>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
}
