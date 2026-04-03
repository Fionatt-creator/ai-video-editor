#!/usr/bin/env python3
"""
PM English 场景视频生成器
生成纯字幕视频，无数字人

依赖安装:
pip install moviepy gtts pillow numpy
apt-get install ffmpeg imagemagick

使用方法:
python3 generate_pm_videos.py
"""

import json
import os
import re
from moviepy.editor import *
from moviepy.video.tools.segmenting import findObjects
import pyttsx3
import tempfile

# 视频配置
CONFIG = {
    "width": 1080,
    "height": 1920,
    "fps": 24,
    "bg_color": (25, 25, 35),
    "accent_color": (74, 144, 217),  # 蓝色
    "highlight_color": (255, 215, 0),  # 黄色高亮
    "text_color": (255, 255, 255),
    "font_size_normal": 55,
    "font_size_speaker": 45,
    "font_size_keyword": 40,
}

class PMSceneVideoGenerator:
    def __init__(self, output_dir="./output"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def parse_dialogue(self, text):
        """解析对话文本"""
        dialogues = []
        lines = text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 匹配 "Speaker: \"Content\"" 格式
            match = re.match(r'^([^:]+):\s*["\']?(.+?)["\']?$', line)
            if match:
                speaker = match.group(1).strip()
                content = match.group(2).strip().strip('"\'')
                dialogues.append({
                    "speaker": speaker,
                    "text": content
                })
        
        return dialogues
    
    def generate_audio(self, text, output_path):
        """生成语音 - 使用本地 TTS"""
        try:
            engine = pyttsx3.init()
            engine.setProperty('rate', 150)  # 语速
            engine.setProperty('volume', 0.9)  # 音量
            engine.save_to_file(text, output_path)
            engine.runAndWait()
            return True
        except Exception as e:
            print(f"语音生成失败: {e}")
            return False
    
    def create_background(self, duration):
        """创建渐变背景"""
        # 创建纯色背景
        bg = ColorClip(
            size=(CONFIG["width"], CONFIG["height"]),
            color=CONFIG["bg_color"]
        ).set_duration(duration)
        
        # 添加 subtle gradient overlay (使用半透明矩形模拟)
        gradient = ColorClip(
            size=(CONFIG["width"], CONFIG["height"]),
            color=(30, 30, 45)
        ).set_duration(duration).set_opacity(0.5)
        
        return CompositeVideoClip([bg, gradient])
    
    def create_speaker_label(self, speaker, start_time, duration):
        """创建说话人标签"""
        # 头像占位符
        avatar = TextClip(
            "👤",
            fontsize=70,
            color='white'
        ).set_position((80, 150))
        
        # 名字
        name = TextClip(
            speaker,
            fontsize=CONFIG["font_size_speaker"],
            color='#4A90D9',
            font='Arial-Bold'
        ).set_position((170, 170))
        
        # 下划线
        underline = ColorClip(
            size=(200, 3),
            color=CONFIG["accent_color"]
        ).set_position((170, 220))
        
        # 设置时间
        clips = [
            avatar.set_start(start_time).set_duration(duration),
            name.set_start(start_time).set_duration(duration),
            underline.set_start(start_time).set_duration(duration).set_opacity(0.7)
        ]
        
        return clips
    
    def create_subtitle(self, text, start_time, duration, is_active=True):
        """创建字幕"""
        if is_active:
            # 当前句子 - 白色大字
            txt = TextClip(
                text,
                fontsize=CONFIG["font_size_normal"],
                color='white',
                font='Arial-Bold',
                size=(900, None),
                method='caption',
                align='center',
                stroke_color='black',
                stroke_width=2
            )
            txt = txt.set_position('center')
            txt = txt.fadein(0.3)
        else:
            # 非当前句子 - 灰色小字
            txt = TextClip(
                text,
                fontsize=40,
                color='gray',
                font='Arial',
                size=(800, None),
                method='caption',
                align='center'
            )
            txt = txt.set_position(('center', 1200))
            txt = txt.set_opacity(0.5)
        
        return txt.set_start(start_time).set_duration(duration)
    
    def create_progress_bar(self, current, total, start_time, duration):
        """创建进度指示器"""
        bar_width = 600
        bar_height = 4
        dot_radius = 12
        
        clips = []
        
        # 背景线
        bg_line = ColorClip(
            size=(bar_width, bar_height),
            color=(100, 100, 100)
        ).set_position(('center', 1600))
        clips.append(bg_line.set_start(start_time).set_duration(duration))
        
        # 进度点
        for i in range(total):
            x_pos = (CONFIG["width"] - bar_width) // 2 + (i * bar_width // (total - 1))
            y_pos = 1600 - dot_radius + bar_height // 2
            
            if i <= current:
                # 已完成的点 - 蓝色
                dot = ColorClip((dot_radius * 2, dot_radius * 2), CONFIG["accent_color"])
            else:
                # 未完成的点 - 灰色
                dot = ColorClip((dot_radius * 2, dot_radius * 2), (100, 100, 100))
            
            dot = dot.set_position((x_pos - dot_radius, y_pos))
            clips.append(dot.set_start(start_time).set_duration(duration))
        
        return clips
    
    def generate_scene_video(self, scene_data, scene_id):
        """生成单个场景视频"""
        print(f"\n生成场景 {scene_id}: {scene_data.get('场景名称', 'Unknown')}")
        
        # 解析对话
        dialogue_text = scene_data.get('英文场景对话', '')
        dialogues = self.parse_dialogue(dialogue_text)
        
        if not dialogues:
            print(f"警告: 场景 {scene_id} 没有解析到对话")
            return None
        
        print(f"  解析到 {len(dialogues)} 句对话")
        
        # 生成音频并计算时间
        audio_clips = []
        temp_files = []
        
        for i, dialogue in enumerate(dialogues):
            temp_audio = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            temp_audio.close()
            temp_files.append(temp_audio.name)
            
            if self.generate_audio(dialogue['text'], temp_audio.name):
                audio = AudioFileClip(temp_audio.name)
                audio_clips.append(audio)
                dialogue['duration'] = audio.duration
                dialogue['audio'] = audio
            else:
                # 如果语音生成失败，使用默认时长
                dialogue['duration'] = 5.0
        
        # 计算总时长
        total_duration = sum(d['duration'] for d in dialogues)
        print(f"  总时长: {total_duration:.1f}秒")
        
        # 设置每句的开始时间
        current_time = 0
        for dialogue in dialogues:
            dialogue['start'] = current_time
            current_time += dialogue['duration']
        
        # 创建视频片段
        video_clips = []
        
        # 1. 背景
        background = self.create_background(total_duration)
        video_clips.append(background)
        
        # 2. 每句字幕和说话人
        for i, dialogue in enumerate(dialogues):
            start = dialogue['start']
            duration = dialogue['duration']
            
            # 说话人标签
            speaker_clips = self.create_speaker_label(
                dialogue['speaker'],
                start,
                duration
            )
            video_clips.extend(speaker_clips)
            
            # 当前字幕
            subtitle = self.create_subtitle(
                dialogue['text'],
                start,
                duration,
                is_active=True
            )
            video_clips.append(subtitle)
            
            # 进度条
            progress_clips = self.create_progress_bar(
                i,
                len(dialogues),
                start,
                duration
            )
            video_clips.extend(progress_clips)
        
        # 合成视频
        final_video = CompositeVideoClip(video_clips, size=(CONFIG["width"], CONFIG["height"]))
        
        # 添加音频
        if audio_clips:
            final_audio = concatenate_audioclips(audio_clips)
            final_video = final_video.set_audio(final_audio)
        
        # 导出
        output_path = os.path.join(self.output_dir, f"scene_{scene_id:03d}.mp4")
        
        print(f"  导出视频: {output_path}")
        final_video.write_videofile(
            output_path,
            fps=CONFIG["fps"],
            codec='libx264',
            audio_codec='aac',
            threads=4,
            logger=None  # 减少输出
        )
        
        # 清理临时文件
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
            except:
                pass
        
        print(f"  ✓ 完成!")
        return output_path


# 示例场景数据
SAMPLE_SCENES = [
    {
        "场景编号": "1",
        "场景名称": "Annual/Quarterly Product Strategic Planning Meeting",
        "英文场景对话": """PM Lead: "Let's kick things off by reviewing last quarter's OKRs."
PM1: "Sure thing. We hit 78% DAU retention, just shy of our 80% target."
PM2: "That tracks with our UX audit findings."
PM Lead: "Good call. Let's bubble that up to strategic priority."
PM1: "Valid point. We might need more granular segmentation."""
    },
    {
        "场景编号": "4",
        "场景名称": "Product Roadmap Planning Discussion",
        "英文场景对话": """PM1: "Before we dive into Q2 roadmap, let's do a sanity check on current capacity."
Tech Lead: "Exactly. We're already operating at 110%."
PM2: "Understood. Maybe we can apply the MoSCoW method here."
Stakeholder: "Hold on. From ROI perspective, can we fast-track that?"
PM1: "Good point. Let's visualize the trade-offs."""
    },
    {
        "场景编号": "11",
        "场景名称": "Risk Assessment and Management Meeting",
        "英文场景对话": """PM1: "Alright team, let's kick off this risk deep dive."
PM2: "I've been chewing on the technical debt aspect."
PM3: "Good catch. That's a classic time bomb scenario."
PM1: "Let's plot it on the impact-probability matrix."
PM2: "Ouch, that's a showstopper in the making."
PM3: "Maybe split the rollout into phased releases."""
    }
]


def main():
    """主函数"""
    print("=" * 60)
    print("PM English 场景视频生成器")
    print("=" * 60)
    
    generator = PMSceneVideoGenerator(output_dir="./pm_videos")
    
    # 生成示例场景
    for scene in SAMPLE_SCENES:
        scene_id = int(scene["场景编号"])
        generator.generate_scene_video(scene, scene_id)
    
    print("\n" + "=" * 60)
    print("所有视频生成完成!")
    print(f"输出目录: {generator.output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
