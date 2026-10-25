import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { HallOfFameEntry } from '../types/game';
import { Trophy, X, Medal, ShieldCheck, Flame } from 'lucide-react';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HallOfFameEntry[];
  currentNickname: string;
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentNickname,
}) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  const getMedalBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: '🥇', label: '금메달', color: 'from-amber-400 to-yellow-500 text-amber-950', ring: 'ring-amber-400' };
      case 2:
        return { icon: '🥈', label: '은메달', color: 'from-slate-300 to-slate-400 text-slate-900', ring: 'ring-slate-300' };
      case 3:
        return { icon: '🥉', label: '동메달', color: 'from-amber-600 to-amber-700 text-amber-100', ring: 'ring-amber-600' };
      default:
        return { icon: `${rank}`, label: `${rank}위`, color: 'bg-white/10 text-slate-300', ring: 'ring-transparent' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border transition-all ${
          theme === 'excel'
            ? 'bg-white border-gray-400 text-gray-800 font-sans'
            : 'glass-panel border-white/20 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            theme === 'excel'
              ? 'bg-excel-header text-white border-excel-headerDark'
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-black text-base tracking-wide">
              {theme === 'excel' ? '우수 실적자 명예의 전당' : '명예의 전당'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anti-cheat note */}
        <div className="px-6 py-2.5 bg-indigo-500/10 border-b border-indigo-400/20 text-[11px] text-indigo-300 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>닉네임 및 IP 식별자 해시를 검증하여 다중 계정 점수 조작을 방지합니다.</span>
        </div>

        {/* Podium for Top 3 */}
        <div className="px-6 py-6 border-b border-white/10 flex items-end justify-center space-x-3 text-center">
          {/* 2nd place */}
          {entries[1] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">🥈</span>
              <div className="w-full glass-panel rounded-2xl py-3 px-1 border-t-2 border-slate-300">
                <div className="text-xs font-bold truncate max-w-[90px] mx-auto text-slate-200">
                  {entries[1].nickname}
                </div>
                <div className="text-xs font-black text-slate-300 mt-0.5">
                  {entries[1].winCount}승
                </div>
              </div>
            </div>
          )}

          {/* 1st place */}
          {entries[0] && (
            <div className="flex-1 flex flex-col items-center -translate-y-2">
              <span className="text-3xl mb-1 animate-bounce">🥇</span>
              <div className="w-full bg-gradient-to-b from-amber-500/20 to-yellow-500/10 rounded-2xl py-4 px-1 border-t-2 border-amber-400 shadow-lg shadow-amber-500/20">
                <div className="text-xs font-black truncate max-w-[90px] mx-auto text-amber-200">
                  {entries[0].nickname}
                </div>
                <div className="text-sm font-black text-amber-300 mt-0.5">
                  {entries[0].winCount}승
                </div>
              </div>
            </div>
          )}

          {/* 3rd place */}
          {entries[2] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">🥉</span>
              <div className="w-full glass-panel rounded-2xl py-2.5 px-1 border-t-2 border-amber-600">
                <div className="text-xs font-bold truncate max-w-[90px] mx-auto text-amber-400/90">
                  {entries[2].nickname}
                </div>
                <div className="text-xs font-black text-amber-400 mt-0.5">
                  {entries[2].winCount}승
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full List */}
        <div className="px-6 py-4 max-h-60 overflow-y-auto space-y-2">
          {entries.map((entry) => {
            const medal = getMedalBadge(entry.rank);
            const isMe = entry.nickname === currentNickname;

            return (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                  isMe
                    ? 'bg-pink-500/20 border border-pink-400/40 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    entry.rank <= 3 ? `bg-gradient-to-tr ${medal.color}` : 'bg-white/10 text-slate-300'
                  }`}>
                    {entry.rank <= 3 ? medal.icon : entry.rank}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span className={isMe ? 'text-pink-300' : ''}>{entry.nickname}</span>
                      {isMe && <span className="text-[10px] bg-pink-500/40 text-pink-200 px-1.5 py-0.2 rounded">나</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      IP 검증 완료 • 실시간 랭킹
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-amber-300">
                    {entry.winCount}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">회 정답</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
