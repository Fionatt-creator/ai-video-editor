/****************************
 * VoiceCraft Pro - 音频工具函数
 ****************************/

/**
 * 根据文本粗略估算音频时长（秒）
 */
export function estimateDuration(text: string): number {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const englishWords = text.match(/[a-zA-Z]+/g)?.length ?? 0;
  return chineseChars / 4.5 + englishWords * 0.5 + 0.5;
}

/**
 * 计算音频波形峰值数据（用于可视化）
 */
export async function computeWaveformPeaks(
  audioBuffer: AudioBuffer,
  points: number = 1000
): Promise<number[]> {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / points);
  const peaks: number[] = [];

  for (let i = 0; i < points; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(channelData[start + j] || 0);
      if (val > max) max = val;
    }
    peaks.push(max);
  }

  return peaks;
}

/**
 * 将 Blob 解码为 AudioBuffer
 */
export async function blobToAudioBuffer(blob: Blob, ctx: AudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

/**
 * 格式化时间显示 mm:ss.ms
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * 生成 UUID
 */
export function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 随机生成柔和的颜色（用于角色）
 */
export function generateCharacterColor(index: number): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];
  return colors[index % colors.length];
}

/**
 * 自动识别文稿中的角色名
 */
export function extractCharacters(text: string): string[] {
  const patterns = [
    /^(.+?)[:：]\s*/gm,
    /\*\*(.+?)\*\*[:：]/g,
    /\[(.+?)\]/g,
    /^(.+?)\s+说[:：]/gm,
  ];

  const candidates = new Set<string>();
  const commonWords = new Set(['我', '你', '他', '她', '它', '我们', '你们', '他们', '这个', '那个', '这里', '那里']);

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[1].trim();
      if (name.length <= 20 && !commonWords.has(name) && name.length >= 1) {
        candidates.add(name);
      }
    }
  }

  return Array.from(candidates);
}

/**
 * 将文本按角色分割为句子数组
 */
export function parseScript(
  text: string,
  characters: { id: string; name: string }[]
): Array<{ characterId: string; text: string }> {
  const lines = text.split(/\n/);
  const result: Array<{ characterId: string; text: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;
    for (const char of characters) {
      const regex = new RegExp(`^${escapeRegex(char.name)}[:：\\s]+(.+)$`);
      const match = trimmed.match(regex);
      if (match) {
        result.push({ characterId: char.id, text: match[1].trim() });
        matched = true;
        break;
      }
    }

    if (!matched) {
      // 未匹配到角色，默认归给第一个角色（通常是旁白）
      const defaultChar = characters[0];
      if (defaultChar) {
        result.push({ characterId: defaultChar.id, text: trimmed });
      }
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
