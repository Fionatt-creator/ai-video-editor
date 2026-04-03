# PM English 低成本字幕视频方案

## 方案概述

放弃数字人方案，改用**纯字幕视频**形式：
- 空白/渐变背景
- 对话文字逐句显示
- 关键词高亮
- 简单音效或AI配音

**预估成本**：$0（仅需服务器计算资源）

---

## 技术栈

### 核心工具

| 工具 | 用途 | 成本 |
|-----|------|------|
| **MoviePy** | Python视频编辑库，添加文字/动画 | 免费开源 |
| **FFmpeg** | 视频编码/处理 | 免费开源 |
| **gTTS/Azure TTS** | AI语音合成 | 免费/$1 per 1000字 |
| **Pillow** | 文字渲染/图片处理 | 免费开源 |

### 替代方案对比

| 方案 | 优点 | 缺点 | 成本 |
|-----|------|------|------|
| **MoviePy（推荐）** | 灵活、Python生态、可编程 | 学习曲线略陡 | 免费 |
| **CapCutAPI** | 直接控制剪映 | 依赖剪映客户端 | 免费 |
| **FFmpeg纯命令** | 性能高 | 字幕样式受限 | 免费 |
| **Manim** | 动画效果丰富 | 过于复杂 | 免费 |

---

## 视频生成流程

```
输入：对话文本 + 词汇高亮标记
         ↓
步骤1：生成语音（gTTS/Azure TTS）
         ↓
步骤2：计算每句时间戳
         ↓
步骤3：MoviePy渲染视频
       - 创建空白画布（1080x1920，竖屏）
       - 逐句添加文字（打字机效果）
       - 关键词高亮（颜色/背景）
       - 添加说话人标签（PM1/PM2）
         ↓
步骤4：FFmpeg合成音频+视频
         ↓
输出：MP4视频文件
```

---

## 视频样式设计

### 竖屏布局（9:16）

```
┌─────────────────────┐
│                     │
│   🎙️ PM Lead        │  ← 说话人标签
│                     │
│   "Let's kick       │  ← 当前句子
│    things off..."   │
│                     │
│   💬 PM1            │  ← 下一句预览（淡化）
│   "Sure thing..."   │
│                     │
│   ───────────────   │  ← 进度条
│   ●────○────○       │
│                     │
│   [kick things off] │  ← 关键词提示
│    正式开始         │
│                     │
└─────────────────────┘
```

### 字幕样式

**普通对话**：
- 字体：思源黑体 / SF Pro
- 字号：60px
- 颜色：白色 (#FFFFFF)
- 描边：黑色 2px（增强可读性）

**关键词高亮**：
- 背景：黄色半透明圆角矩形
- 颜色：黑色 (#000000)
- 动画：高亮词出现时脉冲效果

**说话人标签**：
- 位置：左上角
- 样式：头像 + 名字
- 当前说话人：高亮显示

---

## 核心代码示例

### 1. 基础视频生成

```python
from moviepy.editor import *
from moviepy.video.tools.segmenting import findObjects
import gtts

# 创建空白背景（竖屏）
background = ColorClip(size=(1080, 1920), color=(30, 30, 40))
background = background.set_duration(30)  # 30秒

# 对话数据
dialogues = [
    {"speaker": "PM Lead", "text": "Let's kick things off by reviewing last quarter's OKRs.", "keywords": ["kick things off", "OKRs"]},
    {"speaker": "PM1", "text": "Sure thing. We hit 78% DAU retention.", "keywords": ["DAU retention"]},
]

# 生成语音
def generate_tts(text, filename):
    tts = gtts.gTTS(text, lang='en')
    tts.save(filename)
    return AudioFileClip(filename)

# 创建字幕片段
def create_subtitle_clip(text, keywords, start_time, duration):
    # 普通文字
    txt_clip = TextClip(text, fontsize=60, color='white', 
                        font='Source-Han-Sans-CN-Bold',
                        stroke_color='black', stroke_width=2)
    txt_clip = txt_clip.set_position('center')
    txt_clip = txt_clip.set_start(start_time).set_duration(duration)
    
    # TODO: 关键词高亮处理
    
    return txt_clip

# 合成视频
final_video = CompositeVideoClip([background])

# 添加每句字幕
current_time = 0
for dialogue in dialogues:
    # 生成语音
    audio = generate_tts(dialogue['text'], f"temp_{current_time}.mp3")
    
    # 创建字幕
    subtitle = create_subtitle_clip(
        dialogue['text'], 
        dialogue['keywords'],
        current_time,
        audio.duration
    )
    
    final_video = CompositeVideoClip([final_video, subtitle])
    current_time += audio.duration

# 导出
final_video.write_videofile("output.mp4", fps=24, codec='libx264')
```

### 2. 打字机效果

```python
def typewriter_effect(text, duration):
    """逐字显示效果"""
    clips = []
    char_duration = duration / len(text)
    
    for i, char in enumerate(text):
        partial_text = text[:i+1]
        clip = TextClip(partial_text, fontsize=60, color='white')
        clip = clip.set_start(i * char_duration).set_duration(char_duration)
        clips.append(clip)
    
    return concatenate_videoclips(clips)
```

### 3. 关键词高亮

```python
def highlight_keywords(text, keywords, start_time, duration):
    """关键词高亮显示"""
    clips = []
    
    # 分割文本
    parts = []
    last_end = 0
    for keyword in keywords:
        idx = text.find(keyword)
        if idx != -1:
            parts.append((text[last_end:idx], False))
            parts.append((keyword, True))
            last_end = idx + len(keyword)
    parts.append((text[last_end:], False))
    
    # 创建文字片段
    x_offset = 0
    for part, is_keyword in parts:
        if is_keyword:
            # 高亮样式
            clip = TextClip(part, fontsize=60, color='black',
                          bg_color='#FFD700', font='Source-Han-Sans-CN-Bold')
        else:
            # 普通样式
            clip = TextClip(part, fontsize=60, color='white',
                          stroke_color='black', stroke_width=2)
        
        clip = clip.set_start(start_time).set_duration(duration)
        clips.append(clip)
    
    return clips
```

### 4. 完整渲染脚本

```python
#!/usr/bin/env python3
"""
PM English 场景视频生成器
输入：飞书Bitable导出的JSON
输出：带字幕的MP4视频
"""

import json
from moviepy.editor import *
from gtts import gTTS
import os

class PMSceneVideoGenerator:
    def __init__(self):
        self.width = 1080
        self.height = 1920
        self.fps = 24
        
    def create_background(self, duration):
        """创建渐变背景"""
        # 可以使用纯色或渐变图片
        bg = ColorClip(size=(self.width, self.height), color=(25, 25, 35))
        return bg.set_duration(duration)
    
    def generate_audio(self, text, output_path):
        """生成语音"""
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(output_path)
        return AudioFileClip(output_path)
    
    def create_speaker_label(self, speaker, start_time, duration):
        """创建说话人标签"""
        # 头像占位符（可以用emoji或简单图形）
        avatar = TextClip("👤", fontsize=80).set_position((80, 200))
        
        # 名字
        name = TextClip(speaker, fontsize=50, color='#4A90D9',
                       font='Source-Han-Sans-CN-Bold')
        name = name.set_position((180, 220))
        
        # 设置时间
        avatar = avatar.set_start(start_time).set_duration(duration)
        name = name.set_start(start_time).set_duration(duration)
        
        return [avatar, name]
    
    def create_subtitle(self, text, keywords, start_time, duration):
        """创建字幕（简化版）"""
        # 完整文本
        txt = TextClip(text, fontsize=55, color='white',
                      font='Source-Han-Sans-CN-Bold',
                      size=(900, None),  # 自动换行
                      method='caption',
                      align='center',
                      stroke_color='black', stroke_width=2)
        
        txt = txt.set_position('center')
        txt = txt.set_start(start_time).set_duration(duration)
        
        # 添加淡入效果
        txt = txt.fadein(0.3)
        
        return txt
    
    def generate_scene_video(self, scene_data, output_path):
        """生成单个场景视频"""
        # 解析对话
        dialogue_text = scene_data['英文场景对话']
        dialogues = self.parse_dialogue(dialogue_text)
        
        # 计算总时长
        total_duration = 0
        audio_clips = []
        
        for i, dialogue in enumerate(dialogues):
            audio_path = f"temp_audio_{i}.mp3"
            audio = self.generate_audio(dialogue['text'], audio_path)
            audio_clips.append(audio)
            dialogue['duration'] = audio.duration
            dialogue['start'] = total_duration
            total_duration += audio.duration
        
        # 创建背景
        background = self.create_background(total_duration)
        video_clips = [background]
        
        # 添加每句字幕
        for dialogue in dialogues:
            # 说话人标签
            labels = self.create_speaker_label(
                dialogue['speaker'],
                dialogue['start'],
                dialogue['duration']
            )
            video_clips.extend(labels)
            
            # 字幕
            subtitle = self.create_subtitle(
                dialogue['text'],
                dialogue.get('keywords', []),
                dialogue['start'],
                dialogue['duration']
            )
            video_clips.append(subtitle)
        
        # 合成视频
        final_video = CompositeVideoClip(video_clips)
        
        # 合成音频
        final_audio = concatenate_audioclips(audio_clips)
        final_video = final_video.set_audio(final_audio)
        
        # 导出
        final_video.write_videofile(
            output_path,
            fps=self.fps,
            codec='libx264',
            audio_codec='aac',
            threads=4
        )
        
        # 清理临时文件
        for i in range(len(dialogues)):
            os.remove(f"temp_audio_{i}.mp3")
        
        return output_path
    
    def parse_dialogue(self, text):
        """解析对话文本"""
        lines = text.strip().split('\n')
        dialogues = []
        
        for line in lines:
            if ':' in line:
                speaker, content = line.split(':', 1)
                dialogues.append({
                    'speaker': speaker.strip(),
                    'text': content.strip().strip('"')
                })
        
        return dialogues

# 使用示例
if __name__ == "__main__":
    generator = PMSceneVideoGenerator()
    
    # 从飞书Bitable读取数据
    scene_data = {
        "场景名称": "年度产品战略规划会议",
        "英文场景对话": """PM Lead: "Let's kick things off by reviewing last quarter's OKRs."
PM1: "Sure thing. We hit 78% DAU retention."
PM2: "That's below target. We need to improve."""
    }
    
    generator.generate_scene_video(scene_data, "scene_001.mp4")
```

---

## 部署方案

### 方案A：本地/服务器批量生成

```bash
# 安装依赖
pip install moviepy gtts pillow

# 安装FFmpeg（Ubuntu）
sudo apt-get install ffmpeg

# 批量生成视频
python batch_generate.py --input scenes.json --output ./videos/
```

**成本**：仅服务器费用（约 $20/月）

### 方案B：云端函数（按需生成）

使用 AWS Lambda / 阿里云函数计算：
- 触发：用户请求生成视频
- 执行：生成视频上传OSS
- 回调：通知前端视频就绪

**成本**：按调用次数计费（约 $0.01/视频）

---

## 优化建议

### 1. 预渲染热门场景
- 前20个热门场景预先生成
- 用户首次访问即可播放
- 其余场景按需生成

### 2. 缓存策略
- 已生成视频缓存30天
- 相同对话直接返回缓存

### 3. 降级方案
- 视频生成中时，先显示文字+音频
- 生成完成自动切换为视频

### 4. 语音优化
- 免费：gTTS（Google文字转语音）
- 付费：Azure TTS（更自然的语音，$1/1000字）

---

## 下一步

1. 确认视频样式（是否需要更多视觉效果）
2. 提供几个场景的示例数据
3. 我可以部署一个Demo版本

预计开发周期：**3-5天**
