'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  Typography,
  Alert,
  Empty,
  Popconfirm,
  message,
} from 'antd'
import {
  SearchOutlined,
  RobotOutlined,
  EyeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Text } = Typography

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface AiLogItem {
  id: number
  user_id: string | null
  session_id: string | null
  module: string
  action: string
  prompt: string
  response: string | null
  model: string | null
  tokens_used: number | null
  status: string
  error_message: string | null
  request_params: Record<string, any> | null
  response_time: number | null
  created_at: string
}

// 操作类型颜色映射
const actionColorMap: Record<string, string> = {
  'label_recognition': 'blue',
  'text_generation': 'green',
  'document_parse': 'purple',
  'standardization': 'orange',
  'other': 'default',
}

// 操作类型标签映射
const actionLabelMap: Record<string, string> = {
  'label_recognition': '标签识别',
  'text_generation': '文本生成',
  'document_parse': '文档解析',
  'standardization': '标准化处理',
  'other': '其他',
}

export default function AiLogPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AiLogItem[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filter, setFilter] = useState<{
    module?: string
    action?: string
    status?: string
    start_date?: string
    end_date?: string
  }>({})
  const [selectedLog, setSelectedLog] = useState<AiLogItem | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  // 统计数据
  const [statistics, setStatistics] = useState({
    total: 0,
    success_count: 0,
    failed_count: 0,
    total_tokens: 0,
  })

  // 获取AI日志列表
  const fetchData = async (params?: { page?: number; page_size?: number }) => {
    setLoading(true)
    try {
      const page = params?.page || pagination.current
      const page_size = params?.page_size || pagination.pageSize

      const searchParams = new URLSearchParams()
      searchParams.set('page', String(page))
      searchParams.set('page_size', String(page_size))
      if (filter.module) searchParams.set('module', filter.module)
      if (filter.action) searchParams.set('action', filter.action)
      if (filter.status) searchParams.set('status', filter.status)
      if (filter.start_date) searchParams.set('start_date', filter.start_date)
      if (filter.end_date) searchParams.set('end_date', filter.end_date)

      const response = await fetch(
        `${API_BASE_URL}/api/v1/ai-logs/?${searchParams.toString()}`
      )
      const result = await response.json()

      if (result.code === 200 && result.data) {
        setData(result.data.items || [])
        setPagination({
          current: result.data.page || 1,
          pageSize: result.data.page_size || 20,
          total: result.data.total || 0,
        })
      }

      // 获取统计信息
      const statsResponse = await fetch(`${API_BASE_URL}/api/v1/ai-logs/stats/summary`)
      const statsData = await statsResponse.json()
      if (statsData) {
        setStatistics({
          total: statsData.total_count || 0,
          success_count: statsData.success_count || 0,
          failed_count: statsData.failed_count || 0,
          total_tokens: statsData.total_tokens || 0,
        })
      }
    } catch (error) {
      console.error('获取AI日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchData({ page: 1, page_size: pagination.pageSize })
  }

  // 重置
  const handleReset = () => {
    setFilter({})
    setPagination({ ...pagination, current: 1 })
    fetchData({ page: 1, page_size: pagination.pageSize })
  }

  // 分页变化
  const handleTableChange = (newPagination: any) => {
    fetchData({ page: newPagination.current, page_size: newPagination.pageSize })
  }

  // 查看详情
  const handleViewDetail = (record: AiLogItem) => {
    setSelectedLog(record)
    setDetailModalVisible(true)
  }

  // 刷新
  const handleRefresh = () => {
    fetchData()
  }

  // 删除日志
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-logs/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 清理旧日志
  const handleCleanup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-logs/cleanup?days=30`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.message) {
        message.success(result.message)
        fetchData()
      }
    } catch (error) {
      message.error('清理失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<AiLogItem> = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 130,
      render: (value: string) => (
        <Tag color={actionColorMap[value] || 'default'}>
          {actionLabelMap[value] || value || '其他'}
        </Tag>
      ),
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '提示词',
      dataIndex: 'prompt',
      key: 'prompt',
      ellipsis: true,
      render: (value: string) => value?.substring(0, 50) + (value && value.length > 50 ? '...' : '') || '-',
    },
    {
      title: '响应',
      dataIndex: 'response',
      key: 'response',
      ellipsis: true,
      render: (value: string) => value?.substring(0, 50) + (value && value.length > 50 ? '...' : '') || '-',
    },
    {
      title: 'Token',
      dataIndex: 'tokens_used',
      key: 'tokens_used',
      width: 80,
      render: (value: number) => value || '-',
    },
    {
      title: '耗时',
      dataIndex: 'response_time',
      key: 'response_time',
      width: 80,
      render: (value: number) => value ? `${value}ms` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (value: string) => (
        value === 'success' ? (
          <Tag color="success">成功</Tag>
        ) : (
          <Tag color="error">失败</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定删除此日志？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined />
          AI交互日志
        </h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          查看偏差报告自动化中的AI交互记录，包括标签识别、文档解析、标准化处理等
        </p>
      </div>

      {/* GMP合规提示 */}
      <Alert
        message="GMP合规说明"
        description="AI生成的报告内容和标准化建议仅供人工参考，需经过质量人员审核确认后方可生效。AI不参与任何业务决策。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总调用次数"
              value={statistics.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="成功次数"
              value={statistics.success_count}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="失败次数"
              value={statistics.failed_count}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总Token消耗"
              value={statistics.total_tokens}
              suffix="Token"
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索条件 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Select
                placeholder="模块"
                value={filter.module}
                onChange={(value) => setFilter({ ...filter, module: value })}
                style={{ width: 150 }}
                allowClear
                options={[
                  { label: '试剂管理', value: 'reagent' },
                  { label: '偏差报告', value: 'deviation' },
                  { label: 'SOP管理', value: 'sop' },
                ]}
              />
              <Select
                placeholder="操作类型"
                value={filter.action}
                onChange={(value) => setFilter({ ...filter, action: value })}
                style={{ width: 150 }}
                allowClear
                options={[
                  { label: '标签识别', value: 'label_recognition' },
                  { label: '文本生成', value: 'text_generation' },
                  { label: '文档解析', value: 'document_parse' },
                  { label: '标准化处理', value: 'standardization' },
                ]}
              />
              <Select
                placeholder="状态"
                value={filter.status}
                onChange={(value) => setFilter({ ...filter, status: value })}
                style={{ width: 100 }}
                allowClear
                options={[
                  { label: '成功', value: 'success' },
                  { label: '失败', value: 'failed' },
                ]}
              />
              <RangePicker
                onChange={(dates) => {
                  setFilter({
                    ...filter,
                    start_date: dates?.[0]?.format('YYYY-MM-DD'),
                    end_date: dates?.[1]?.format('YYYY-MM-DD'),
                  })
                }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Popconfirm
                title="确定清理30天前的日志？"
                onConfirm={handleCleanup}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  清理旧日志
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card>
        {data.length > 0 ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1300 }}
          />
        ) : (
          <Empty description="暂无AI交互日志记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="AI交互详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {selectedLog && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="时间">
                {dayjs(selectedLog.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="模块">{selectedLog.module || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作">
                <Tag color={actionColorMap[selectedLog.action] || 'default'}>
                  {actionLabelMap[selectedLog.action] || selectedLog.action || '其他'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="模型">{selectedLog.model || '-'}</Descriptions.Item>
              <Descriptions.Item label="Token使用">{selectedLog.tokens_used || '-'}</Descriptions.Item>
              <Descriptions.Item label="响应时间">
                {selectedLog.response_time ? `${selectedLog.response_time}ms` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedLog.status === 'success' ? (
                  <Tag color="success">成功</Tag>
                ) : (
                  <Tag color="error">失败</Tag>
                )}
              </Descriptions.Item>
              {selectedLog.user_id && (
                <Descriptions.Item label="用户ID" span={2}>
                  {selectedLog.user_id}
                </Descriptions.Item>
              )}
              {selectedLog.session_id && (
                <Descriptions.Item label="会话ID" span={2}>
                  {selectedLog.session_id}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedLog.prompt && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>提示词:</Text>
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                    whiteSpace: 'pre-wrap',
                    fontSize: 12,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {selectedLog.prompt}
                </div>
              </div>
            )}

            {selectedLog.response && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>AI响应:</Text>
                <div
                  style={{
                    background: '#f6ffed',
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                    whiteSpace: 'pre-wrap',
                    fontSize: 12,
                    maxHeight: 200,
                    overflow: 'auto',
                    border: '1px solid #b7eb8f',
                  }}
                >
                  {selectedLog.response}
                </div>
              </div>
            )}

            {selectedLog.error_message && (
              <div>
                <Text strong>错误信息:</Text>
                <div
                  style={{
                    background: '#fff2f0',
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                    border: '1px solid #ffccc7',
                    color: '#ff4d4f',
                  }}
                >
                  {selectedLog.error_message}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
