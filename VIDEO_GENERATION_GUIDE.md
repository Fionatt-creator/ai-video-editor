# PM English 视频生成指南

## 视频效果预览

生成的视频效果如下：

```
┌─────────────────────┐
│                     │
│   👤 PM Lead        │  ← 说话人标签（蓝色）
│   ─────────         │
│                     │
│                     │
│   "Let's kick       │  ← 当前对话（白色大字）
│    things off..."   │     渐入动画效果
│                     │
│                     │
│                     │
│                     │
│   ○──●──○──○──○     │  ← 进度指示器
│                     │
└─────────────────────┘
   1080 × 1920 (竖屏)
```

## 运行步骤

### 1. 安装依赖

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg imagemagick

# macOS
brew install ffmpeg imagemagick

# Python依赖
pip install moviepy gtts pillow numpy
```

### 2. 运行脚本

```bash
python3 generate_pm_videos.py
```

### 3. 查看输出

视频将生成在 `./pm_videos/` 目录：
- `scene_001.mp4` - 年度产品战略规划会议
- `scene_004.mp4` - 产品路线图规划研讨
- `scene_011.mp4` - 风险评估与管理会议

## 视频特点

### 视觉设计
- **竖屏9:16** (1080×1920) - 适合手机观看
- **深色背景** (25, 25, 35) - 护眼，专业感
- **蓝色强调色** - 说话人标签和进度条
- **白色大字** - 清晰易读

### 动画效果
- **渐入动画** - 每句对话淡入显示
- **进度指示器** - 显示当前对话位置
- **说话人标签** - 头像+名字+下划线

### 音频
- **AI语音合成** - 使用Google TTS (gTTS)
- **自动时长** - 根据语音长度自动计算每句时长

## 从飞书Bitable批量生成

如果你想从完整的238个场景生成视频，可以修改脚本：

```python
# 替换 SAMPLE_SCENES 为从Bitable读取的数据
import requests

# 调用飞书API获取数据
scenes = fetch_from_bitable(app_token, table_id)

for scene in scenes:
    scene_id = int(scene["场景编号"])
    generator.generate_scene_video(scene, scene_id)
```

## 成本估算

| 项目 | 成本 |
|-----|------|
| gTTS语音合成 | 免费 |
| MoviePy视频生成 | 免费 |
| 服务器计算 | ~$0.01/视频 |
| **总计238个场景** | **~$2-3** |

对比数字人方案 ($1800)，成本降低 **99.8%**

## 后续优化方向

1. **关键词高亮** - 在字幕中用黄色背景高亮关键词组
2. **双语字幕** - 同时显示英文和中文翻译
3. **更自然的语音** - 使用Azure TTS替换gTTS
4. **背景动画** - 添加 subtle 动态背景
5. **头像图片** - 用真实头像替换emoji

## 问题排查

### ImageMagick 错误
如果遇到 `IMAGEMAGICK_BINARY` 错误：
```bash
# 查找ImageMagick路径
which convert

# 在Python中设置
from moviepy.config import change_settings
change_settings({"IMAGEMAGICK_BINARY": "/usr/bin/convert"})
```

### 字体问题
如果文字显示为方块：
```bash
# 安装中文字体
sudo apt-get install fonts-wqy-zenhei

# 或在代码中使用系统自带字体
font='Arial-Bold'  # 或 'DejaVu-Sans'
```
