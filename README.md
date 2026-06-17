# Dahzah 偏差报告自动化模块

独立的质量检验偏差报告自动化模块，可快速集成到任何 Dahzah 框架项目中。

## 功能特性

- **SOP规则管理**：维护偏差报告标准化规则库
- **Word文件解析**：自动解析上传的偏差报告Word文档
- **AI标准化处理**：基于SOP规则和AI能力进行内容标准化
- **标准报告生成**：自动生成符合标准格式的Word报告
- **模板管理**：支持自定义报告模板
- **多图片上传**：支持偏差现场图片上传
- **结果预览**：所见即所得的预览视图

## 模块结构

```
dahzah-deviation-automation/
├── backend/                                    # 后端模块
│   ├── app/                                   # 应用骨架（集成时替换）
│   │   ├── core/                              # 核心模块
│   │   │   └── storage.py                     # 文件存储
│   │   └── platform/                          # 平台模块
│   │       ├── database.py                    # 数据库会话
│   │       └── ai/                           # AI服务
│   │           ├── service.py                 # AI日志服务
│   │           └── minimax_util.py           # MiniMax工具
│   ├── deviation_automation_api.py           # 主API路由
│   ├── deviation_models.py                    # 数据模型
│   ├── alembic/                              # 数据库迁移
│   │   └── versions/
│   │       └── 20260617_0001_deviation_automation.py
│   └── alembic.ini
├── frontend/                                  # 前端模块
│   └── src/
│       ├── actions/
│       │   └── deviation.ts                   # Server Actions
│       ├── app/
│       │   └── quality/
│       │       └── deviation-automation/
│       │           ├── create/page.tsx        # 新建报告
│       │           ├── history/page.tsx      # 历史查询
│       │           ├── preview/[id]/page.tsx # 预览视图
│       │           ├── sop/page.tsx          # SOP规则管理
│       │           └── templates/page.tsx    # 模板管理
│       └── types/
│           └── deviation.ts                   # 类型定义
└── README.md
```

## 快速集成

本模块设计了两种集成方式：

### 方式一：完整替换（推荐）

```bash
# 复制应用骨架（核心依赖）
cp -r backend/app/platform/ai/* 你的后端路径/app/platform/ai/
cp backend/app/platform/database.py 你的后端路径/app/platform/
cp backend/app/core/storage.py 你的后端路径/app/core/

# 复制偏差报告自动化模块
cp backend/deviation_automation_api.py 你的后端路径/app/modules/quality/
cp backend/deviation_models.py 你的后端路径/app/modules/quality/

# 复制数据库迁移脚本
cp backend/alembic/versions/* 你的后端路径/alembic/versions/
```

### 方式二：独立模块运行

```bash
cd backend
uv sync
uv run uvicorn app.modules.quality.deviation_automation_api:router --reload
```

---

### 注册路由

编辑主项目的路由注册文件：

```python
from fastapi import APIRouter
from app.modules.quality.deviation_automation_api import router as deviation_automation_router

api_router = APIRouter()
api_router.include_router(
    deviation_automation_router,
    prefix="/quality",
    tags=["偏差报告自动化"]
)
```

### 运行数据库迁移

```bash
cd 你的后端项目
uv run alembic upgrade head
```

### 配置环境变量

```env
# 数据库
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dahzah

# MiniMax AI (AI处理功能需要)
MINIMAX_API_KEY=your_api_key
MINIMAX_BASE_URL=https://api.minimax.chat
MINIMAX_MODEL=MiniMax-VL-01
```

---

## API 接口

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /quality/deviation-automation/tasks | 获取任务列表 |
| POST | /quality/deviation-automation/tasks | 创建任务 |
| GET | /quality/deviation-automation/tasks/{id} | 获取任务详情 |
| DELETE | /quality/deviation-automation/tasks/{id} | 删除任务 |
| POST | /quality/deviation-automation/upload | 上传Word文件 |
| POST | /quality/deviation-automation/tasks/{id}/ai-process | 触发AI处理 |
| GET | /quality/deviation-automation/tasks/{id}/preview | 获取预览内容 |
| POST | /quality/deviation-automation/tasks/{id}/generate-standard | 生成标准报告 |
| GET | /quality/deviation-automation/tasks/{id}/download/original | 下载原始文件 |
| GET | /quality/deviation-automation/tasks/{id}/download/standard | 下载标准报告 |

### SOP规则管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /quality/deviation-automation/sop-rules | 获取SOP规则列表 |
| POST | /quality/deviation-automation/sop-rules | 新增SOP规则 |
| PUT | /quality/deviation-automation/sop-rules/{id} | 更新SOP规则 |
| DELETE | /quality/deviation-automation/sop-rules/{id} | 删除SOP规则 |
| POST | /quality/deviation-automation/sop-rules/{id}/upload | 上传SOP文件 |
| POST | /quality/deviation-automation/sop-rules/{id}/ai-parse | AI解析SOP文件 |
| GET | /quality/deviation-automation/sop-rules/{id}/download | 下载SOP文件 |

### 模板管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /quality/deviation-automation/templates | 获取模板列表 |
| POST | /quality/deviation-automation/templates | 新增模板 |
| PUT | /quality/deviation-automation/templates/{id} | 更新模板 |
| DELETE | /quality/deviation-automation/templates/{id} | 删除模板 |
| POST | /quality/deviation-automation/templates/{id}/upload | 上传模板文件 |
| POST | /quality/deviation-automation/templates/{id}/activate | 启用模板 |
| GET | /quality/deviation-automation/templates/{id}/download | 下载模板文件 |

---

## 数据库表结构

### dev_task (偏差任务表)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| task_id | SERIAL | 主键 |
| deviation_no | VARCHAR(100) | 偏差编号（唯一） |
| creator | VARCHAR(100) | 编制人 |
| auditor | VARCHAR(100) | QA审核人 |
| report_date | DATE | 报告日期 |
| original_file_path | VARCHAR(500) | 原始文件路径 |
| standard_file_path | VARCHAR(500) | 标准文件路径 |
| task_status | INTEGER | 任务状态（1待处理2处理中3已生成4完成） |
| ai_result | TEXT | AI处理结果 |
| create_time | TIMESTAMP | 创建时间 |
| update_time | TIMESTAMP | 更新时间 |

### dev_sop_rule (SOP规则表)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| sop_code | VARCHAR(100) | SOP编号（唯一） |
| sop_full_name | VARCHAR(200) | SOP全称 |
| sop_version | VARCHAR(50) | 版本号 |
| business_tag | VARCHAR(100) | 业务标签 |
| standard_limit | TEXT | 标准限度 |
| standard_sentence | TEXT | 标准语句 |
| sop_file_path | VARCHAR(500) | SOP文件路径 |
| status | INTEGER | 状态（0停用1生效） |
| create_time | TIMESTAMP | 创建时间 |
| update_time | TIMESTAMP | 更新时间 |

### dev_report_template (报告模板表)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | SERIAL | 主键 |
| name | VARCHAR(200) | 模板名称 |
| description | TEXT | 模板描述 |
| file_path | VARCHAR(500) | 模板文件路径 |
| is_active | INTEGER | 是否启用（0否1是） |
| create_time | TIMESTAMP | 创建时间 |
| update_time | TIMESTAMP | 更新时间 |

---

## 任务状态说明

| 状态值 | 说明 |
|--------|------|
| 1 | 待处理 |
| 2 | AI处理中 |
| 3 | 已生成 |
| 4 | 已完成 |

---

## AI 处理流程

1. **上传原始报告** → 解析Word文档内容
2. **触发AI处理** → 自动识别相关SOP并提取关键信息
3. **预览编辑** → 所见即所得的预览视图
4. **生成标准报告** → 基于模板生成标准Word文档

---

## 依赖说明

### 后端依赖

```toml
# pyproject.toml
fastapi>=0.100.0
sqlalchemy>=2.0.0
asyncpg>=0.28.0
pydantic>=2.0.0
mammoth>=1.6.0
python-docx>=1.0.0
httpx>=0.25.0
```

### 前端依赖

```json
{
  "antd": "^6.4.3",
  "@ant-design/icons": "^6.2.3",
  "dayjs": "^1.11.0"
}
```

---

## 注意事项

1. **数据库 Schema**：表创建在 `qms` schema 下
2. **文件存储**：使用本地文件系统，存放在 `uploads/deviation_automation/` 目录
3. **模板文件**：需包含 `{{}}` 占位符用于内容替换
4. **AI 功能**：可选功能，不配置 MiniMax API Key 时无法使用

---

## License

MIT
