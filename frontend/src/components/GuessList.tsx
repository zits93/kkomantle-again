import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GuessItem, GameStats } from '../types/game';
import { Globe, User, CheckCircle2 } from 'lucide-react';
import { useSortedGuesses, SortMode } from '../hooks/useSortedGuesses';
export type { SortMode };

interface GuessListProps {
  allGuesses: GuessItem[];
  currentNickname: string;
  gameStats?: GameStats;
  myGuesses?: GuessItem[];
}

export interface RankTierInfo {
  tier: 'answer' | 'top10' | 'top100' | 'top1000' | 'cold';
  rankText: string;
  tierLabel: string;
  pillClass: string;
  barColor: string;
  barWidthPercent: number;
}

export const getRankTierInfo = (rank?: number, similarity: number = 0, isAnswer: boolean = false): RankTierInfo => {
  if (isAnswer || rank === 1 || similarity >= 100) {
    return {
      tier: 'answer',
      rankText: '#1 정답',
      tierLabel: '정답',
      pillClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      barColor: 'bg-emerald-500',
      barWidthPercent: 100,
    };
  }

  if (rank && rank <= 10) {
    const pct = Math.max(90, 100 - (rank - 1) * 1.0);
    return {
      tier: 'top10',
      rankText: `#${rank}`,
      tierLabel: '초근접',
      pillClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      barColor: 'bg-rose-500',
      barWidthPercent: pct,
    };
  }

  if (rank && rank <= 100) {
    const pct = 90 - ((rank - 10) / 90) * 25;
    return {
      tier: 'top100',
      rankText: `#${rank}`,
      tierLabel: '매우 가까움',
      pillClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      barColor: 'bg-amber-500',
      barWidthPercent: pct,
    };
  }

  if (rank && rank <= 1000) {
    const pct = 65 - ((rank - 100) / 900) * 35;
    return {
      tier: 'top1000',
      rankText: `#${rank}`,
      tierLabel: '유사함',
      pillClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      barColor: 'bg-zinc-500 dark:bg-zinc-400',
      barWidthPercent: pct,
    };
  }

  // Outside 1000 or cold
  const coldWidth = Math.max(6, Math.min(25, similarity * 0.4));
  return {
    tier: 'cold',
    rankText: '-',
    tierLabel: '순위 밖 (<24.0점)',
    pillClass: 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
    barColor: 'bg-zinc-300 dark:bg-zinc-700',
    barWidthPercent: coldWidth,
  };
};

export const GuessList: React.FC<GuessListProps> = ({ allGuesses, currentNickname, gameStats }) => {
  const { theme } = useTheme();
  const [sortMode, setSortMode] = useState<SortMode>('similarity');

  const top1000Cutoff = gameStats?.top1000Cutoff ?? 24.0;
  const totalWords = gameStats?.totalWords ?? 500000;

  const displayList = useSortedGuesses(allGuesses, sortMode);

  // Excel Mode Table with Subtle Data Bars
  if (theme === 'excel') {
    return (
      <div className="w-full max-w-5xl mx-auto my-2 px-2 select-none overflow-x-auto">
        <div className="flex items-center space-x-1 border-b border-gray-300 bg-gray-50 text-xs mb-1 px-1">
          <button
            onClick={() => setSortMode('similarity')}
            className={`px-3 py-1 font-sans border-t-2 ${
              sortMode === 'similarity'
                ? 'border-excel-header bg-white font-semibold text-gray-800'
                : 'border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            유사도순 ({allGuesses.length}건)
          </button>
          <button
            onClick={() => setSortMode('recent')}
            className={`px-3 py-1 font-sans border-t-2 ${
              sortMode === 'recent'
                ? 'border-excel-header bg-white font-semibold text-gray-800'
                : 'border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            최신순 ({allGuesses.length}건)
          </button>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs text-left bg-white font-sans">
          <thead>
            <tr className="bg-gray-100 text-gray-600 font-semibold text-[11px]">
              <th className="border border-gray-300 px-2 py-1 w-12 text-center bg-gray-200">#</th>
              <th className="border border-gray-300 px-3 py-1 w-28">작업자</th>
              <th className="border border-gray-300 px-4 py-1">단어</th>
              <th className="border border-gray-300 px-3 py-1 w-20 text-center">순위</th>
              <th className="border border-gray-300 px-4 py-1 w-44">유사도 게이지</th>
              <th className="border border-gray-300 px-3 py-1 w-24 text-right">점수</th>
              <th className="border border-gray-300 px-3 py-1 w-24 text-center">판정</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 text-center py-8 text-gray-400">
                  데이터가 없습니다. 상단 수식 입력줄에서 단어를 입력하세요.
                </td>
              </tr>
            ) : (
              displayList.map((item, index) => {
                const tier = getRankTierInfo(item.rank, item.similarity, item.isAnswer);
                const isMe = item.nickname === currentNickname;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 ${item.isAnswer ? 'bg-emerald-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                  >
                    <td className="border border-gray-300 px-2 py-1 text-center bg-gray-100 text-gray-400 font-mono text-[10px]">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 truncate">
                      <span className={isMe ? 'font-bold text-excel-header' : 'text-gray-700'}>
                        {item.nickname} {isMe && '(나)'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-1 font-semibold text-gray-900">
                      <span>{item.word}</span>
                      {item.notice && (
                        <span className="text-[10px] text-gray-400 font-normal ml-1.5 font-mono">({item.notice})</span>
                      )}
                    </td>

                    {/* Rank */}
                    <td className="border border-gray-300 px-3 py-1 text-center font-mono font-semibold text-xs text-gray-700">
                      {tier.rankText}
                    </td>

                    {/* Excel In-Cell Data Bar */}
                    <td className="border border-gray-300 px-2 py-1 relative">
                      <div className="w-full h-2.5 bg-gray-100 rounded-xs overflow-hidden">
                        <div
                          className={`h-full ${tier.barColor} opacity-75`}
                          style={{ width: `${tier.barWidthPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Score */}
                    <td className="border border-gray-300 px-3 py-1 text-right font-mono font-medium">
                      {item.similarity.toFixed(1)}%
                    </td>

                    {/* Verdict */}
                    <td className="border border-gray-300 px-3 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${tier.pillClass}`}>
                        {tier.tierLabel}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Clean, Minimalist Scandinavian/Linear Aesthetic List
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-12">
      {/* Sort Controls & Meta Bar */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 text-xs select-none" role="group" aria-label="정렬 기준">
          <button
            type="button"
            onClick={() => setSortMode('similarity')}
            aria-pressed={sortMode === 'similarity'}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              sortMode === 'similarity'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            유사도순
          </button>
          <button
            type="button"
            onClick={() => setSortMode('recent')}
            aria-pressed={sortMode === 'recent'}
            className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
              sortMode === 'recent'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            최신순
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono">
          <span className="hidden sm:inline">1000위 컷: ≥ {top1000Cutoff.toFixed(1)}점 ·</span>
          <span>총 {displayList.length}단어</span>
        </div>
      </div>

      {/* Rows */}
      {displayList.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs space-y-1">
          <div>아직 입력된 단어가 없습니다. 위 입력창에서 첫 단어를 입력해보세요.</div>
          <div className="text-[11px] text-zinc-500 font-mono pt-1">
            (총 {totalWords.toLocaleString()}개 단어 중 유사도 {top1000Cutoff.toFixed(1)}점 이상 시 1,000위 내 진입)
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((item, index) => {
            const tier = getRankTierInfo(item.rank, item.similarity, item.isAnswer);
            const isMe = item.nickname === currentNickname;

            return (
              <div
                key={item.id}
                className={`border rounded-xl px-4 py-3 bg-white dark:bg-zinc-900 transition-colors ${
                  item.isAnswer
                    ? 'border-emerald-500/60'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* 1. Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-xs font-mono text-zinc-400 w-5 shrink-0 text-center">
                      {index + 1}
                    </span>
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {item.word}
                      </span>

                      {item.notice && (
                        <span
                          className="text-[10px] text-zinc-400 font-mono truncate"
                          title="자동 정규화/교정"
                        >
                          ({item.notice})
                        </span>
                      )}

                      {item.isAnswer && (
                        <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>정답</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Badges: Rank & Similarity */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${tier.pillClass}`}
                    >
                      {tier.rankText}
                    </span>

                    <span className="text-sm font-mono text-zinc-700 dark:text-zinc-200 font-bold min-w-[3.25rem] text-right">
                      {item.similarity.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 2. Visual Bar Track (Clean, Thin, Solid) */}
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${tier.barColor}`}
                    style={{ width: `${tier.barWidthPercent}%` }}
                  />
                </div>

                {/* 3. Subtitle Row */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                  <span className="truncate">
                    {item.nickname} {isMe && '(나)'}
                  </span>
                  <span className="text-[10px]">
                    {tier.tierLabel}
                    {item.rank && item.rank <= 1000 && ` (${item.rank}/1000)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
