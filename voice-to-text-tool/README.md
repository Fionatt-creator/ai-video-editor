# 🎙️ 语音转文字工具 | Voice to Text Tool

一个基于 FunASR 的开源语音转文字工具，支持多种音频格式、LLM 重点提取和多格式导出。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-green.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue.svg)

## ✨ 功能特性

- 🎙️ **多格式支持** - MP3, WAV, M4A, OGG, FLAC, AAC, WMA
- 📝 **精准识别** - 基于阿里达摩院 FunASR，中文识别率高
- 🧠 **智能提取** - 调用 LLM 自动提取重点、生成摘要
- 📤 **多格式导出** - TXT, SRT 字幕, JSON, Word 文档
- 🌐 **在线使用** - Web 界面，无需安装，支持拖拽上传
- ⚡ **实时进度** - 显示转写进度，支持大文件处理

## 🚀 快速启动

### 方式一：Docker 一键启动（推荐）

```bash
# 1. 克隆或下载项目
cd voice-to-text-tool

# 2. 启动服务
./start.sh

# 或者使用 docker-compose
docker-compose up -d
```

访问 http://localhost:8080 即可使用

### 方式二：本地运行

#### 环境要求
- Python 3.10+
- FFmpeg

#### 安装步骤

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动后端服务
python main.py

# 4. 访问前端（可以直接打开 frontend/index.html 或使用静态服务器）
# 例如使用 Python 的简易 HTTP 服务器
cd ../frontend
python -m http.server 3000
```

访问 http://localhost:3000 使用前端界面

## 📖 使用指南

### 1. 上传音频文件
- 拖拽音频文件到上传区域，或点击选择文件
- 支持格式：MP3, WAV, M4A, OGG, FLAC, AAC, WMA
- 单个文件最大 500MB

### 2. 等待 ASR 转写
- 系统自动上传并开始转写
- 首次启动会下载 ASR 模型（约 200MB，仅需一次）
- 显示实时转写进度

### 3. 查看和编辑结果
- 在"转写内容"标签页查看完整文本
- 点击"编辑"按钮可修正转写内容
- 实时显示字符数和词数统计

### 4. 提取重点
- 切换到"重点提取"标签页
- 选择摘要类型：关键要点 / 内容摘要 / 章节大纲
- 点击"生成摘要"，AI 自动分析内容

### 5. 导出文件
- 支持导出为 TXT、SRT 字幕、JSON、Word 文档
- Word 导出可包含生成的摘要

## 🔧 配置说明

### 可选：配置 LLM 功能

如需使用 AI 重点提取功能，可配置 Kimi API：

```bash
# 复制环境变量文件
cp backend/.env.example backend/.env

# 编辑 .env 文件，添加 API Key
KIMI_API_KEY=your_api_key_here
LLM_MODEL=kimi-k2.5
```

获取 API Key：[Kimi 开放平台](https://platform.moonshot.cn/)

> 如不配置，工具仍可使用本地简单摘要功能

### Docker 环境变量

编辑 `docker-compose.yml`：

```yaml
environment:
  - KIMI_API_KEY=your_api_key_here
  - LLM_MODEL=kimi-k2.5
```

## 🛠️ 常用命令

```bash
# 启动服务
./start.sh start

# 停止服务
./start.sh stop

# 重启服务
./start.sh restart

# 查看日志
./start.sh logs

# 查看状态
./start.sh status
```

## 📁 项目结构

```
voice-to-text-tool/
├── backend/              # Python FastAPI 后端
│   ├── main.py          # 主程序入口
│   ├── requirements.txt # Python 依赖
│   └── .env.example     # 环境变量示例
├── frontend/            # Web 前端界面
│   ├── index.html       # 主页面
│   ├── app.js           # 前端逻辑
│   └── styles.css       # 样式文件
├── exports/             # 导出文件目录（自动创建）
├── uploads/             # 上传文件目录（自动创建）
├── Dockerfile           # Docker 构建文件
├── docker-compose.yml   # Docker Compose 配置
├── start.sh             # 启动脚本
└── README.md            # 本文件
```

## 🔌 API 文档

启动服务后访问：http://localhost:8080/docs

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload` | POST | 上传音频文件 |
| `/api/status/{task_id}` | GET | 获取任务状态 |
| `/api/summary` | POST | 生成内容摘要 |
| `/api/export` | POST | 导出转写结果 |
| `/api/tasks` | GET | 获取任务列表 |

## ⚙️ 技术栈

- **ASR 引擎**: FunASR (Paraformer-zh)
- **后端**: Python + FastAPI
- **前端**: HTML5 + CSS3 + Vanilla JS
- **部署**: Docker + Docker Compose

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🙏 致谢

- [FunASR](https://github.com/alibaba-damo-academy/FunASR) - 阿里巴巴达摩院开源语音识别工具包
- [Kimi](https://platform.moonshot.cn/) - Moonshot AI 大语言模型

## 💬 反馈与支持

如有问题或建议，欢迎提交 Issue 或 Pull Request。

---

Made with ❤️ by AI Assistant
