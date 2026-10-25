import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { HallOfFameEntry } from '../types/game';
import { Trophy, X, ShieldCheck } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

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
  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hall-of-fame-title"
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.3)] border transition-all ${
          theme === 'excel'
            ? 'bg-white border-gray-400 text-gray-800 font-sans'
            : 'bg-white dark:bg-zinc-900 border-zinc-200/90 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
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
            <h2 id="hall-of-fame-title" className="font-bold text-sm tracking-tight">랭킹</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all active:scale-95 text-zinc-400 cursor-pointer"
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
            <div className="text-center py-10 px-4 text-xs text-zinc-400">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2.5">
                <Trophy className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="font-medium text-zinc-700 dark:text-zinc-300">아직 등록된 정답자가 없습니다.</p>
              <p className="text-[11px] text-zinc-400 mt-1">단어를 맞추고 랭킹 1위가 되어보세요!</p>
            </div>
          ) : (
            entries.map((entry) => {
              const isMe = entry.nickname === currentNickname;

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
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs font-semibold ${
                        entry.rank === 1
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : entry.rank === 2
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                          : entry.rank === 3
                          ? 'bg-amber-800/10 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {entry.rank}
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
