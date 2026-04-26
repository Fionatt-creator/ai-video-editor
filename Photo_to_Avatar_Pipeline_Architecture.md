# Photo to Avatar - 后端 Pipeline 技术架构

> 后端开发参考文档 - Pipeline 详细设计

---

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway (Kong/Nginx)                       │
│                         限流 | 认证 | 路由 | 日志                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   Audio       │           │   Avatar        │           │   Video         │
│   Service     │           │   Service       │           │   Service       │
│               │           │                 │           │                 │
│ - 音频上传    │           │ - 任务管理      │           │ - 视频合成      │
│ - Vozo集成    │           │ - Seedance调用  │           │ - 比例适配      │
│ - 时长处理    │           │ - 状态轮询      │           │ - 导出管理      │
└───────┬───────┘           └────────┬────────┘           └────────┬────────┘
        │                            │                            │
        ▼                            ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Message Queue (RabbitMQ)                         │
│                    avatar_generation_queue                                  │
│                    video_render_queue                                       │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Worker Cluster                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Seedance    │  │ Seedance    │  │ Video       │  │ Video       │       │
│  │ Worker 1    │  │ Worker 2    │  │ Render 1    │  │ Render 2    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Storage Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   MinIO/S3      │  │   PostgreSQL    │  │     Redis       │             │
│  │  (对象存储)      │  │   (业务数据)     │  │   (缓存/队列)    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pipeline 详细流程

### 2.1 阶段一：音频处理 Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   输入选择    │────▶│   音频生成    │────▶│   质量检测    │────▶│   时长校验   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                       │
                    ┌──────────────────────────────────────────────────┘
                    ▼
        ┌─────────────────────────┐
        │    时长 < 15s ?         │
        └────────────┬────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  是 → 返回错误   │    │  否 → 继续处理   │
│  提示重新上传    │    │                 │
└─────────────────┘    └────────┬────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        ┌─────────────────┐    ┌─────────────────┐
        │   时长 > 60s ?   │    │  15s ≤ 时长     │
        │                 │    │  ≤ 60s          │
        └────────┬────────┘    └────────┬────────┘
                 │                       │
        ┌────────┴────────┐              │
        ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 是 → 截取    │  │ 音频转码     │  │ 音频存储     │
│ 前60s       │  │ (统一为MP3)  │  │ 到 MinIO     │
└──────────────┘  └──────────────┘  └──────────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ 写入数据库   │
                                       │ 返回audio_id │
                                       └──────────────┘
```

### 2.2 阶段二：Avatar 生成 Pipeline

```
┌──────────────┐
│  接收请求    │
│  (image +    │
│   audio_id)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 1. 图片预检  │
│    - 格式    │
│    - 尺寸    │
│    - 人脸    │
│    - 清晰度  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 预检通过?    │
└──────┬───────┘
       │
   ┌───┴───┐
   ▼       ▼
┌──────┐ ┌──────────┐
│ 否   │ │   是     │
│ 返回 │ │   继续   │
│ 错误 │ │          │
└──────┘ └────┬─────┘
              │
              ▼
┌──────────────┐     ┌─────────────────────────────────────────┐
│ 2. 创建任务  │────▶│ 写入数据库:                             │
│              │     │ - avatar_id (UUID)                      │
│              │     │ - user_id                               │
│              │     │ - image_url                             │
│              │     │ - audio_id                              │
│              │     │ - status: PENDING                       │
│              │     │ - cost_usd: 0.55                        │
│              │     │ - created_at                            │
└──────────────┘     └─────────────────────────────────────────┘
                              │
                              ▼
┌──────────────┐     ┌─────────────────────────────────────────┐
│ 3. 提交队列  │────▶│ MQ: avatar_generation_queue             │
└──────────────┘     │ message: {avatar_id, image_url,         │
                     │          audio_url, priority}           │
                     └─────────────────────────────────────────┘
                              │
                              ▼
┌──────────────┐     ┌─────────────────────────────────────────┐
│ 4. Worker    │────▶│ a. 更新状态: PROCESSING                 │
│   消费任务   │     │ b. 下载图片 + 音频到本地                │
│              │     │ c. 调用 Seedance API                    │
└──────────────┘     │ d. 获取 task_id                         │
                     │ e. 轮询生成状态 (每5s)                   │
                     │ f. 生成完成 → 下载视频                   │
                     │ g. 上传视频到 MinIO                     │
                     │ h. 更新状态: COMPLETED                  │
                     │ i. 记录 completed_at                    │
                     └─────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           ┌──────────────┐    ┌──────────────┐
           │   成功       │    │   失败       │
           │              │    │  (重试3次)   │
           │ 通知用户     │    │ 仍失败 →     │
           │ Webhook/     │    │ 状态: FAILED │
           │ SSE推送      │    │ 记录错误原因 │
           └──────────────┘    └──────────────┘
```

### 2.3 阶段三：视频创作 Pipeline

```
┌──────────────┐
│ 用户选择     │
│ - avatar_id  │
│ - 比例       │
│ - 可选BGM    │
│ - 可选字幕   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 1. 加载素材  │
│ - 获取Avatar │
│   视频URL    │
│ - 验证可用性 │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. 视频处理  │
│              │
│ ┌──────────┐ │
│ │ 比例适配 │ │
│ │ - 9:16   │ │
│ │   居中   │ │
│ │ - 16:9   │ │
│ │   居中   │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ 添加BGM  │ │
│ │ (可选)   │ │
│ │ 混音处理 │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ 添加字幕 │ │
│ │ (可选)   │ │
│ │ 渲染SRT  │ │
│ └──────────┘ │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. 渲染导出  │
│ - FFmpeg     │
│ - H.264编码  │
│ - 质量优化   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. 存储结果  │
│ - 上传MinIO  │
│ - 生成URL    │
│ - 写入DB     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. 返回用户  │
│ - 预览链接   │
│ - 下载链接   │
└──────────────┘
```

---

## 3. 数据库 Schema

```sql
-- 用户表
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 音频表
CREATE TABLE audios (
    audio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    source_type VARCHAR(20) NOT NULL, -- 'vozo', 'record', 'upload'
    vozo_voice_id VARCHAR(50),
    text_content TEXT,
    original_filename VARCHAR(255),
    storage_url VARCHAR(500) NOT NULL,
    duration DECIMAL(8,2) NOT NULL, -- 秒
    file_size BIGINT, -- 字节
    format VARCHAR(10), -- mp3, wav, etc.
    status VARCHAR(20) DEFAULT 'active', -- active, deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Avatar表
CREATE TABLE avatars (
    avatar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    image_url VARCHAR(500) NOT NULL,
    audio_id UUID REFERENCES audios(audio_id),
    video_url VARCHAR(500),
    seedance_task_id VARCHAR(100),
    status VARCHAR(20) NOT NULL, -- pending, processing, completed, failed
    duration DECIMAL(8,2), -- 秒
    cost_usd DECIMAL(10,4) DEFAULT 0.55,
    resolution VARCHAR(10) DEFAULT '720p',
    model VARCHAR(50) DEFAULT 'doubao-seedance-2.0-fast',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 视频项目表
CREATE TABLE video_projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    avatar_id UUID REFERENCES avatars(avatar_id),
    aspect_ratio VARCHAR(10) NOT NULL, -- '9:16' or '16:9'
    output_url VARCHAR(500),
    bgm_url VARCHAR(500),
    subtitles JSONB, -- [{start, end, text}]
    status VARCHAR(20) NOT NULL, -- pending, rendering, completed, failed
    render_params JSONB, -- 存储渲染参数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_status ON avatars(status);
CREATE INDEX idx_audios_user_id ON audios(user_id);
CREATE INDEX idx_video_projects_user_id ON video_projects(user_id);
```

---

## 4. 核心代码结构

```
project/
├── cmd/
│   ├── api/                    # API服务入口
│   │   └── main.go
│   └── worker/                 # Worker服务入口
│       └── main.go
├── internal/
│   ├── handler/                # HTTP处理器
│   │   ├── avatar_handler.go
│   │   ├── audio_handler.go
│   │   └── video_handler.go
│   ├── service/                # 业务逻辑层
│   │   ├── avatar_service.go   # Avatar生成逻辑
│   │   ├── audio_service.go    # 音频处理逻辑
│   │   └── video_service.go    # 视频创作逻辑
│   ├── repository/             # 数据访问层
│   │   ├── avatar_repo.go
│   │   ├── audio_repo.go
│   │   └── video_repo.go
│   ├── infrastructure/         # 基础设施
│   │   ├── seedance/           # Seedance客户端
│   │   │   └── client.go
│   │   ├── vozo/               # Vozo客户端
│   │   │   └── client.go
│   │   ├── storage/            # 存储客户端
│   │   │   └── minio.go
│   │   └── ffmpeg/             # FFmpeg封装
│   │       └── ffmpeg.go
│   ├── worker/                 # 任务处理器
│   │   ├── avatar_worker.go    # Avatar生成Worker
│   │   └── video_worker.go     # 视频渲染Worker
│   └── model/                  # 数据模型
│       ├── avatar.go
│       ├── audio.go
│       └── video.go
├── pkg/
│   ├── validator/              # 验证工具
│   └── utils/                  # 通用工具
├── config/
│   └── config.yaml
├── scripts/
│   └── deploy.sh
└── Dockerfile
```

---

## 5. API 端点列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/audios/upload | 上传音频文件 |
| POST | /api/v1/audios/generate | Vozo生成音频 |
| POST | /api/v1/audios/record | 保存录音 |
| GET | /api/v1/audios/{id} | 获取音频信息 |
| POST | /api/v1/avatars | 创建Avatar任务 |
| GET | /api/v1/avatars/{id} | 获取Avatar状态 |
| GET | /api/v1/avatars | 获取用户Avatar列表 |
| DELETE | /api/v1/avatars/{id} | 删除Avatar |
| POST | /api/v1/video-projects | 创建视频项目 |
| GET | /api/v1/video-projects/{id} | 获取项目状态 |
| GET | /api/v1/video-projects | 获取项目列表 |
| WS | /ws/avatars/{id}/progress | Avatar生成进度WebSocket |

---

## 6. 配置示例

```yaml
# config.yaml
server:
  port: 8080
  mode: production

database:
  postgres:
    host: localhost
    port: 5432
    user: avatar_user
    password: xxx
    database: avatar_db
  redis:
    host: localhost
    port: 6379

storage:
  minio:
    endpoint: localhost:9000
    access_key: xxx
    secret_key: xxx
    bucket: avatars
    use_ssl: false

external:
  seedance:
    api_key: xxx
    api_url: https://api.seedance.ai/v2
    model: doubao-seedance-2.0-fast
    resolution: 720p
    cost_per_video_usd: 0.55
  vozo:
    api_key: xxx
    api_url: https://api.vozo.ai/v1

queue:
  rabbitmq:
    url: amqp://guest:guest@localhost:5672
    queues:
      avatar_generation: avatar_generation_queue
      video_render: video_render_queue

worker:
  avatar_workers: 5
  video_workers: 3
  poll_interval: 5s
```

---

## 7. 部署架构

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Nginx/ALB)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │  API Pod 1 │ │  API Pod 2 │ │  API Pod 3 │
       │  (K8s)     │ │  (K8s)     │ │  (K8s)     │
       └────────────┘ └────────────┘ └────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Primary)     │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
           ┌────────────┐    ┌────────────┐
           │  Replica 1 │    │  Replica 2 │
           └────────────┘    └────────────┘

       ┌─────────────────────────────────────────┐
       │         Worker Deployment               │
       │  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
       │  │ Worker 1 │ │ Worker 2 │ │ Worker 3│ │
       │  └──────────┘ └──────────┘ └─────────┘ │
       └─────────────────────────────────────────┘

       ┌─────────────────────────────────────────┐
       │         External Services               │
       │  ┌────────┐ ┌────────┐ ┌────────┐     │
       │  │Seedance│ │  Vozo  │ │ MinIO  │     │
       │  └────────┘ └────────┘ └────────┘     │
       └─────────────────────────────────────────┘
```

---

## 8. 监控指标

| 指标 | 类型 | 说明 |
|------|------|------|
| avatar_generation_total | Counter | Avatar生成总数 |
| avatar_generation_duration | Histogram | 生成耗时分布 |
| avatar_generation_cost_usd | Counter | 累计成本(USD) |
| video_render_total | Counter | 视频渲染总数 |
| video_render_duration | Histogram | 渲染耗时分布 |
| audio_upload_total | Counter | 音频上传总数 |
| api_request_duration | Histogram | API响应时间 |
| worker_queue_depth | Gauge | 队列深度 |

---

*文档结束*
