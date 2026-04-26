/****************************
 * VoiceCraft Pro - 音色商店页面
 ****************************/
import { useState, useEffect } from 'react';
import { listVoices, getSubscriptionInfo } from '../services/api';
import { VoiceInfo } from '../types';
import { ArrowLeft, Search, Star, Play, Globe, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VoiceStore() {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [filtered, setFiltered] = useState<VoiceInfo[]>([]);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    loadVoices();
    loadQuota();
  }, []);

  const loadVoices = async () => {
    try {
      const list = await listVoices();
      setVoices(list);
      setFiltered(list);
    } catch (e) {
      console.error('Failed to load voices:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadQuota = async () => {
    try {
      const info = await getSubscriptionInfo();
      setQuota({
        used: info.character_count || 0,
        limit: info.character_limit || 0,
      });
    } catch (e) {
      console.error('Failed to load quota:', e);
    }
  };

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      voices.filter((v) =>
        v.name.toLowerCase().includes(s) ||
        v.language?.toLowerCase().includes(s) ||
        v.accent?.toLowerCase().includes(s)
      )
    );
  }, [search, voices]);

  const toggleFavorite = (voiceId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(voiceId)) next.delete(voiceId);
      else next.add(voiceId);
      return next;
    });
  };

  const grouped = filtered.reduce((acc, voice) => {
    const lang = voice.language || '其他';
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(voice);
    return acc;
  }, {} as Record<string, VoiceInfo[]>);

  return (
    <div className="h-full flex flex-col">
      {/* 顶部 */}
      <div className="h-14 border-b border-gray-700 bg-gray-800 flex items-center px-4 gap-3">
        <Link to="/" className="text-gray-400 hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <Globe size={18} className="text-blue-400" />
        <span className="font-medium">音色商店</span>
        {quota && (
          <span className="text-xs text-gray-500 ml-auto">
            本月已用: {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
          </span>
        )}
      </div>

      {/* 搜索 */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索音色、语言、口音..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-sm">未找到匹配的音色</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([lang, list]) => (
              <div key={lang}>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  {lang} ({list.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {list.map((voice) => (
                    <div
                      key={voice.voice_id}
                      className="border border-gray-700 rounded-lg p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-gray-500" />
                          <span className="text-sm font-medium truncate">{voice.name}</span>
                        </div>
                        <button
                          onClick={() => toggleFavorite(voice.voice_id)}
                          className="text-gray-500 hover:text-yellow-400 transition-colors"
                        >
                          <Star
                            size={14}
                            className={favorites.has(voice.voice_id) ? 'fill-yellow-400 text-yellow-400' : ''}
                          />
                        </button>
                      </div>
                      <div className="text-[10px] text-gray-500 mb-2">
                        {voice.gender} · {voice.accent || '默认口音'}
                      </div>
                      <button
                        onClick={() => {
                          // TODO: 生成 3s 预览
                          alert(`预览音色: ${voice.name}\nVoice ID: ${voice.voice_id}`);
                        }}
                        className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-xs rounded flex items-center justify-center gap-1 transition-colors"
                      >
                        <Play size={10} />
                        试听
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
