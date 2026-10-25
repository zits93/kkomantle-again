import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { HallOfFameEntry } from '../types/game';
import { Trophy, X, ShieldCheck } from 'lucide-react';

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

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-xl overflow-hidden shadow-2xl border transition-all ${
          theme === 'excel'
            ? 'bg-white border-gray-400 text-gray-800 font-sans'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-b ${
            theme === 'excel'
              ? 'bg-excel-header text-white border-excel-headerDark'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-sm tracking-tight">명예의 전당</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Notice */}
        <div className="px-5 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>닉네임 및 IP 식별자를 검증하여 동일 인물 어뷰징을 방지합니다.</span>
        </div>

        {/* List */}
        <div className="p-3 max-h-72 overflow-y-auto space-y-1">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400">
              아직 정답자가 없습니다.
            </div>
          ) : (
            entries.map((entry) => {
              const isMe = entry.nickname === currentNickname;
              const isMedal = entry.rank <= 3;

              return (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition text-xs ${
                    isMe
                      ? 'bg-zinc-100 dark:bg-zinc-800 font-medium'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 text-center font-mono font-semibold text-zinc-500">
                      {isMedal ? medals[entry.rank - 1] : `${entry.rank}`}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {entry.nickname} {isMe && <span className="text-zinc-400 text-[10px] ml-1">(나)</span>}
                    </span>
                  </div>

                  <div className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                    {entry.winCount} <span className="font-normal text-[11px] text-zinc-400">승</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
