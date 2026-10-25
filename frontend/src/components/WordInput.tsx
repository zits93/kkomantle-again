import React, { useState, useRef } from 'react';
import { CornerDownLeft, Info, AlertCircle } from 'lucide-react';
import { GameStats } from '../types/game';

interface WordInputProps {
  onSubmit: (word: string) => void;
  disabled?: boolean;
  error?: string | null;
  gameStats?: GameStats;
}

export const WordInput: React.FC<WordInputProps> = ({ onSubmit, disabled, error, gameStats }) => {
  const [word, setWord] = useState('');
  const [showTierGuide, setShowTierGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalWords = gameStats?.totalWords ?? 500000;
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

  // Note: Excel mode input is handled directly by ExcelView.
  // Clean Light & Dark Minimalist Input
  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="kkomantle-word-input" className="sr-only">
          추측할 단어를 입력하세요
        </label>
        <div className="flex items-center rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06),0_8px_24px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] focus-within:border-zinc-800 dark:focus-within:border-zinc-200 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-zinc-100/10 focus-within:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.12),0_16px_36px_-6px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden">
          <input
            id="kkomantle-word-input"
            ref={inputRef}
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="단어 입력 -> 추측 (엔터)"
            disabled={disabled}
            autoFocus
            className="flex-1 bg-transparent px-4 py-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none text-base font-normal"
          />

          <button
            type="submit"
            disabled={!word.trim() || disabled}
            aria-label="단어 제출"
            className="mr-2 px-4 h-9 min-w-[60px] shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 hover:from-zinc-700 hover:to-zinc-900 dark:hover:from-white dark:hover:to-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs flex items-center justify-center space-x-1.5 transition-all duration-150 shadow-sm hover:shadow active:scale-95 cursor-pointer motion-reduce:transform-none"
          >
            <span>확인</span>
            <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-xs text-rose-500 font-medium mt-2 px-2 animate-[bounce_0.5s_ease-in-out_2] motion-reduce:animate-none flex items-center space-x-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
            className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all active:scale-95 cursor-pointer font-semibold border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs motion-reduce:transform-none"
            title="클릭하여 순위별 유사도 컷오프 확인"
          >
            <span>유사도 ≥ {top1000Cutoff.toFixed(1)}점</span>
            <Info className="w-3 h-3 opacity-60 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Expandable Tier Cutoff Card with Soft Glassmorphism */}
      {showTierGuide && (
        <div className="mt-3 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md text-xs space-y-2.5 select-none shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1)] transition-all">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span>순위 구간별 유사도 기준표 (총 {totalWords.toLocaleString()}개 단어)</span>
            <button
              onClick={() => setShowTierGuide(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[10px] px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              닫기
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">#1 정답</div>
              <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">100.0점</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
              <div className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">Top 10 (초근접)</div>
              <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">≥ {top10Cutoff.toFixed(1)}점</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <div className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">Top 100 (매우 가까움)</div>
              <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">≥ {top100Cutoff.toFixed(1)}점</div>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
              <div className="text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">Top 1000 (유사함)</div>
              <div className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5">≥ {top1000Cutoff.toFixed(1)}점</div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
            * 유사도 {top1000Cutoff.toFixed(1)}점 미만 단어는 1,000위 밖(순위 미제공)으로 표시됩니다.
          </div>
        </div>
      )}
    </div>
  );
};
