# 语音转文字工具 - 部署指南

## 📦 交付内容

```
voice-to-text-tool/
├── backend/              # Python FastAPI 后端
│   ├── main.py          # 主程序（ASR + LLM + 导出功能）
│   ├── requirements.txt # Python 依赖
│   └── .env.example     # 环境变量示例
├── frontend/            # Web 前端
│   ├── index.html       # 主页面
│   ├── app.js           # 前端逻辑
│   └── styles.css       # 样式
├── exports/             # 导出文件目录
├── uploads/             # 上传文件目录
├── Dockerfile           # Docker 配置
├── docker-compose.yml   # Docker Compose 配置
├── start.sh             # Docker 启动脚本
├── run_local.py         # 本地启动脚本
└── README.md            # 使用说明
```

## 🚀 部署方式

### 方式一：Docker 部署（推荐用于生产）

**系统要求：**
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 内存（ASR模型加载需要）

**部署步骤：**

```bash
cd voice-to-text-tool

# 启动服务
./start.sh

# 或直接使用 docker-compose
docker-compose up -d
```

访问 http://localhost:8080

### 方式二：本地运行（推荐用于开发/测试）

**系统要求：**
- Python 3.10+
- FFmpeg（必须安装，用于音频处理）
- 至少 4GB 内存

**1. 安装依赖**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# 下载安装: https://ffmpeg.org/download.html
```

**2. 安装 Python 依赖**

```bash
cd voice-to-text-tool/backend
pip install -r requirements.txt
```

> 首次安装会下载 PyTorch（约 2GB）和 FunASR 模型（约 200MB）

**3. 启动服务**

```bash
# 在项目根目录
cd voice-to-text-tool

# 方式A：一键启动（同时启动前端和后端）
python run_local.py

# 方式B：单独启动后端
cd backend
python main.py
# 然后打开 frontend/index.html 或使用静态服务器
```

访问 http://localhost:8080（如果使用 run_local.py）或 http://localhost:8000（仅后端）

## ⚙️ 可选配置

### 配置 LLM 功能（重点提取）

1. 复制环境变量文件：
```bash
cp backend/.env.example backend/.env
```

2. 编辑 `backend/.env`，添加 Kimi API Key：
```env
KIMI_API_KEY=your_api_key_here
LLM_MODEL=kimi-k2.5
```

3. 获取 API Key：[https://platform.moonshot.cn/](https://platform.moonshot.cn/)

### Docker 环境变量

编辑 `docker-compose.yml`：
```yaml
services:
  voice-to-text:
    environment:
      - KIMI_API_KEY=your_api_key_here
```

## 📋 功能验证清单

部署后请按以下清单验证功能：

- [ ] 页面能正常访问
- [ ] 能成功上传 MP3 文件
- [ ] 转写状态能实时更新
- [ ] 转写结果能正常显示
- [ ] 能编辑转写内容并保存
- [ ] 能导出 TXT 文件
- [ ] 能导出 SRT 字幕文件
- [ ] 能导出 Word 文档
- [ ] LLM 摘要功能正常（如配置了 API Key）

## 🔧 常见问题

### Q1: 首次启动很慢？
A: 正常。首次启动会下载 ASR 模型（约 200MB），请耐心等待。

### Q2: 中文识别效果不好？
A: 默认使用 paraformer-zh 模型，对普通话识别效果较好。如果有方言需求，可以考虑更换为 sensevoice-small 模型。

### Q3: 大文件处理超时？
A: 修改 `docker-compose.yml` 增加超时设置，或分割音频文件后处理。

### Q4: 如何更换 ASR 模型？
编辑 `backend/main.py`，修改 `get_asr_model()` 函数中的模型名称：
```python
model="paraformer-zh"  # 可选: sensevoice-small, funasr-nano 等
```

## 📞 技术支持

如有问题，请检查：
1. 系统资源是否充足（内存 ≥ 4GB）
2. FFmpeg 是否正确安装
3. 端口 8000/8080 是否被占用
4. Docker 服务是否正常运行

---

**交付日期**: 2024年
**版本**: v1.0.0
