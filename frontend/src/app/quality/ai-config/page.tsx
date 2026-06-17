'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  Switch,
  Select,
  InputNumber,
  message,
  Alert,
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  RobotOutlined,
  KeyOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface AIConfig {
  enabled: boolean
  api_key: string
  base_url: string
  model: string
  max_tokens: number
  temperature: number
  prompt_template?: string
  image_analysis_prompt?: string
  label_recognition_prompt?: string
}

const defaultConfig: AIConfig = {
  enabled: false,
  api_key: '',
  base_url: 'https://api.minimax.chat',
  model: 'MiniMax/VL-01',
  max_tokens: 2048,
  temperature: 0.7,
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function AiConfigPage() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [testLoading, setTestLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 加载配置
  const loadConfig = useCallback(async () => {
    setInitialLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-config/`)
      const data = await response.json()

      if (data.code === 200 && data.data) {
        form.setFieldsValue(data.data)
      } else {
        form.setFieldsValue(defaultConfig)
      }
    } catch (error) {
      console.log('从后端加载配置失败，使用默认配置')
      form.setFieldsValue(defaultConfig)
    } finally {
      setInitialLoading(false)
    }
  }, [form])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // 保存配置到后端
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/v1/ai-config/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (data.code === 200) {
        message.success('AI配置保存成功')
      } else {
        message.error(data.message || '保存失败')
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      message.error('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 重置配置
  const handleReset = async () => {
    form.setFieldsValue(defaultConfig)
    try {
      await fetch(`${API_BASE_URL}/api/v1/ai-config/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultConfig),
      })
    } catch (error) {
      console.log('重置后端配置失败')
    }
    message.success('已重置为默认配置')
  }

  // 测试连接
  const handleTestConnection = async () => {
    setTestLoading(true)
    try {
      const values = form.getFieldsValue()
      const apiKey = values.api_key

      if (!apiKey) {
        message.warning('请先填写API Key')
        setTestLoading(false)
        return
      }

      // 先保存配置
      await fetch(`${API_BASE_URL}/api/v1/ai-config/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      // 测试连接
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const result = await response.json()
      if (result.success) {
        message.success('API连接测试成功')
      } else {
        message.error(result.message || '连接测试失败')
      }
    } catch (error) {
      message.error('API连接测试失败，请检查配置')
    } finally {
      setTestLoading(false)
    }
  }

  // 获取AI状态
  const [aiStatus, setAiStatus] = useState<{ enabled: boolean; configured: boolean } | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ai-config/status`)
        const data = await response.json()
        if (data) {
          setAiStatus(data)
        }
      } catch (error) {
        console.log('获取AI状态失败')
      }
    }
    fetchStatus()
  }, [])

  if (initialLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        加载配置中...
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>AI 配置设置</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSave}
            >
              保存配置
            </Button>
          </Space>
        }
      >
        {/* AI状态提示 */}
        {aiStatus && (
          <Alert
            message={
              aiStatus.configured
                ? 'AI功能已配置并启用'
                : aiStatus.enabled
                  ? 'AI功能已启用但未完整配置'
                  : 'AI功能已禁用'
            }
            description={
              aiStatus.configured
                ? '偏差报告自动化功能可以正常使用'
                : '请配置API Key和基础URL以启用AI功能'
            }
            type={aiStatus.configured ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Alert
          message="配置说明"
          description="AI功能使用 MiniMax API 服务。请确保已配置有效的 API Key。模型 MiniMax/VL-01 支持文本和图片识别，适用于偏差报告自动化场景。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical" initialValues={defaultConfig}>
          {/* 启用开关 */}
          <Divider>
            <Space>
              <RobotOutlined />
              <span>功能开关</span>
            </Space>
          </Divider>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="enabled"
                label="启用AI功能"
                valuePropName="checked"
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>

          {/* API 密钥配置 */}
          <Divider>
            <Space>
              <KeyOutlined />
              <span>API 密钥配置</span>
            </Space>
          </Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="api_key"
                label="MiniMax API Key"
                rules={[{ required: true, message: '请输入API Key' }]}
              >
                <Input.Password
                  placeholder="请输入 MiniMax API Key"
                  prefix={<KeyOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="base_url"
                label="API 地址"
              >
                <Input
                  placeholder="https://api.minimax.chat"
                  prefix={<RobotOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 模型配置 */}
          <Divider>
            <Space>
              <RobotOutlined />
              <span>模型配置</span>
            </Space>
          </Divider>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="model"
                label="模型名称"
              >
                <Select>
                  <Select.Option value="MiniMax/VL-01">MiniMax/VL-01 (推荐)</Select.Option>
                  <Select.Option value="MiniMax-M2.7">MiniMax-M2.7</Select.Option>
                  <Select.Option value="MiniMax-M3">MiniMax-M3</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="temperature"
                label="Temperature (0-1)"
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="max_tokens"
                label="最大 Token 数"
              >
                <InputNumber
                  min={256}
                  max={8192}
                  step={256}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 自定义提示词 */}
          <Divider>
            <Space>
              <SettingOutlined />
              <span>自定义提示词（可选）</span>
            </Space>
          </Divider>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="label_recognition_prompt"
                label="标签识别提示词"
              >
                <Input.TextArea
                  placeholder="自定义试剂标签识别的提示词，用于指导AI从图片中提取信息"
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="prompt_template"
                label="通用提示词模板"
              >
                <Input.TextArea
                  placeholder="自定义通用提示词模板"
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 测试按钮 */}
          <Divider>连接测试</Divider>

          <Row>
            <Col span={24}>
              <Space>
                <Button
                  type="default"
                  icon={<RobotOutlined />}
                  loading={testLoading}
                  onClick={handleTestConnection}
                >
                  测试API连接
                </Button>
              </Space>
            </Col>
          </Row>

          {/* GMP 合规提示 */}
          <Divider />

          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            <RobotOutlined style={{ marginRight: 8 }} />
            AI 内容仅作参考，最终以人工审核确认
          </Text>
        </Form>
      </Card>
    </div>
  )
}
