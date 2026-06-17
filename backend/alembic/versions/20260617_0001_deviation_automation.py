"""
偏差报告自动化表迁移
创建偏差任务表、SOP规则表、报告模板表
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "20260617_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 创建设备任务表
    op.execute("""
        CREATE TABLE IF NOT EXISTS qms.dev_task (
            task_id SERIAL PRIMARY KEY,
            deviation_no VARCHAR(100) NOT NULL UNIQUE,
            creator VARCHAR(100),
            auditor VARCHAR(100),
            report_date DATE,
            original_file_path VARCHAR(500),
            standard_file_path VARCHAR(500),
            task_status INTEGER DEFAULT 1,
            ai_result TEXT,
            create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 创建SOP规则表
    op.execute("""
        CREATE TABLE IF NOT EXISTS qms.dev_sop_rule (
            id SERIAL PRIMARY KEY,
            sop_code VARCHAR(100) NOT NULL UNIQUE,
            sop_full_name VARCHAR(200),
            sop_version VARCHAR(50),
            business_tag VARCHAR(100),
            standard_limit TEXT,
            standard_sentence TEXT,
            sop_file_path VARCHAR(500),
            status INTEGER DEFAULT 1,
            create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 创建报告模板表
    op.execute("""
        CREATE TABLE IF NOT EXISTS qms.dev_report_template (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            file_path VARCHAR(500),
            is_active INTEGER DEFAULT 0,
            create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 创建索引
    op.execute("CREATE INDEX IF NOT EXISTS idx_dev_task_status ON qms.dev_task(task_status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dev_task_deviation_no ON qms.dev_task(deviation_no)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dev_sop_rule_status ON qms.dev_sop_rule(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dev_sop_rule_code ON qms.dev_sop_rule(sop_code)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_dev_template_active ON qms.dev_report_template(is_active)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS qms.dev_report_template")
    op.execute("DROP TABLE IF EXISTS qms.dev_sop_rule")
    op.execute("DROP TABLE IF EXISTS qms.dev_task")
