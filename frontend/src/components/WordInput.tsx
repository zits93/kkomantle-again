import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { CornerDownLeft, Info } from 'lucide-react';
import { GameStats } from '../types/game';

interface WordInputProps {
  onSubmit: (word: string) => void;
  disabled?: boolean;
  error?: string | null;
  gameStats?: GameStats;
}

export const WordInput: React.FC<WordInputProps> = ({ onSubmit, disabled, error, gameStats }) => {
  const { theme } = useTheme();
  const [word, setWord] = useState('');
  const [showTierGuide, setShowTierGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalWords = gameStats?.totalWords ?? 119656;
  const top1000Cutoff = gameStats?.top1000Cutoff ?? 24.0;
  const top100Cutoff = gameStats?.top100Cutoff ?? 45.0;
  const top10Cutoff = gameStats?.top10Cutoff ?? 58.0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = word.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setWord('');
  };

  // Excel Mode Formula Bar
  if (theme === 'excel') {
    return (
      <div className="bg-white border-b border-gray-300 px-3 py-1.5 flex items-center space-x-2 text-xs font-mono">
        <div className="w-16 bg-gray-100 border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700">
          C4
        </div>
        <div className="text-gray-400 font-serif italic text-sm font-bold px-1 select-none">
          fx
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="단어를 입력하고 Enter를 누르세요 (예: 컴퓨터, 달리다, 빠르게)"
            disabled={disabled}
            className="flex-1 border border-gray-300 focus:border-excel-cellSelected focus:ring-1 focus:ring-excel-cellSelected outline-none px-2.5 py-1 text-xs font-sans text-black"
          />
          <button
            type="submit"
            disabled={!word.trim() || disabled}
            className="bg-excel-header hover:bg-excel-headerDark disabled:opacity-40 text-white px-3 py-1 text-xs font-sans rounded transition"
          >
            입력
          </button>
        </form>
        <div className="text-gray-500 font-mono text-[10px] px-2 whitespace-nowrap hidden lg:block">
          [사본DB: {totalWords.toLocaleString()}단어 | 1000위컷: ≥{top1000Cutoff.toFixed(1)}%]
        </div>
      </div>
    );
  }

  // Clean Light & Dark Minimalist Input
  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm focus-within:border-zinc-900 dark:focus-within:border-zinc-300 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-300 transition-all overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="추측할 단어를 입력하세요 (명사, 동사, 부사)"
            disabled={disabled}
            autoFocus
            className="flex-1 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none text-base font-normal"
          />

          <button
            type="submit"
            disabled={!word.trim() || disabled}
            className="mr-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs flex items-center space-x-1 transition"
          >
            <span>확인</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        {error && (
          <p className="text-xs text-rose-500 font-medium mt-1.5 px-2 animate-bounce flex items-center space-x-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
      </form>

      {/* Word Pool & Rank Cutoff Meta Info */}
      <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono select-none">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
          <span>
            전체 단어:{' '}
            <strong className="font-semibold text-zinc-700 dark:text-zinc-200">
              {totalWords.toLocaleString()}
            </strong>
            개
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span>1,000위 컷:</span>
          <button
            type="button"
            onClick={() => setShowTierGuide(prev => !prev)}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer font-semibold border border-zinc-200/60 dark:border-zinc-700/60"
            title="클릭하여 순위별 유사도 컷오프 확인"
          >
            <span>유사도 ≥ {top1000Cutoff.toFixed(1)}점</span>
            <Info className="w-3 h-3 opacity-60 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Expandable Tier Cutoff Card */}
      {showTierGuide && (
        <div className="mt-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 text-xs space-y-2 select-none shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
            <span>순위 구간별 유사도 기준표 (총 {totalWords.toLocaleString()}개 단어)</span>
            <button
              onClick={() => setShowTierGuide(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[10px]"
            >
              닫기
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">#1 정답</div>
              <div className="text-zinc-500 text-[10px] mt-0.5">100.0점</div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
              <div className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">Top 10 (초근접)</div>
              <div className="text-zinc-500 text-[10px] mt-0.5">≥ {top10Cutoff.toFixed(1)}점</div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
              <div className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">Top 100 (매우 가까움)</div>
              <div className="text-zinc-500 text-[10px] mt-0.5">≥ {top100Cutoff.toFixed(1)}점</div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800">
              <div className="text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">Top 1000 (유사함)</div>
              <div className="text-zinc-500 text-[10px] mt-0.5">≥ {top1000Cutoff.toFixed(1)}점</div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400">
            * 유사도 {top1000Cutoff.toFixed(1)}점 미만 단어는 1,000위 밖(순위 미제공)으로 표시됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
