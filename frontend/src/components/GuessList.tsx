import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GuessItem } from '../types/game';
import { Globe, User, CheckCircle2 } from 'lucide-react';

interface GuessListProps {
  myGuesses: GuessItem[];
  allGuesses: GuessItem[];
  currentNickname: string;
}

export interface RankTierInfo {
  tier: 'answer' | 'top10' | 'top100' | 'top300' | 'top1000' | 'cold';
  rankBadgeLabel: string;
  tierName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barGradient: string;
  barGlow: string;
  barWidthPercent: number;
  textColor: string;
  icon: string;
}

export const getRankTierInfo = (rank?: number, similarity: number = 0, isAnswer: boolean = false): RankTierInfo => {
  if (isAnswer || rank === 1 || similarity >= 100) {
    return {
      tier: 'answer',
      rankBadgeLabel: '1위',
      tierName: '정답',
      icon: '🏆',
      badgeBg: 'bg-amber-500/15 dark:bg-amber-500/25',
      badgeText: 'text-amber-600 dark:text-amber-300 font-bold',
      badgeBorder: 'border-amber-400 dark:border-amber-500',
      barGradient: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400',
      barGlow: 'shadow-[0_0_14px_rgba(250,204,21,0.65)] animate-pulse',
      barWidthPercent: 100,
      textColor: 'text-amber-600 dark:text-amber-400 font-bold',
    };
  }

  if (rank && rank <= 10) {
    const pct = Math.max(93, 100 - (rank - 1) * 0.7);
    return {
      tier: 'top10',
      rankBadgeLabel: `${rank}위`,
      tierName: '초근접',
      icon: '🔥',
      badgeBg: 'bg-rose-500/15 dark:bg-rose-500/25',
      badgeText: 'text-rose-600 dark:text-rose-400 font-bold',
      badgeBorder: 'border-rose-400/70 dark:border-rose-500/70',
      barGradient: 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-400',
      barGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.55)] animate-pulse',
      barWidthPercent: pct,
      textColor: 'text-rose-600 dark:text-rose-400 font-bold',
    };
  }

  if (rank && rank <= 100) {
    const pct = 93 - ((rank - 10) / 90) * 18;
    return {
      tier: 'top100',
      rankBadgeLabel: `${rank}위`,
      tierName: '매우 가까움',
      icon: '⚡',
      badgeBg: 'bg-orange-500/15 dark:bg-orange-500/25',
      badgeText: 'text-orange-600 dark:text-orange-400 font-bold',
      badgeBorder: 'border-orange-400/60 dark:border-orange-500/60',
      barGradient: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400',
      barGlow: 'shadow-[0_0_9px_rgba(249,115,22,0.4)]',
      barWidthPercent: pct,
      textColor: 'text-orange-600 dark:text-orange-400 font-semibold',
    };
  }

  if (rank && rank <= 300) {
    const pct = 75 - ((rank - 100) / 200) * 20;
    return {
      tier: 'top300',
      rankBadgeLabel: `${rank}위`,
      tierName: '가까움',
      icon: '🌟',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-600 dark:text-amber-400 font-semibold',
      badgeBorder: 'border-amber-300 dark:border-amber-700',
      barGradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400',
      barGlow: 'shadow-[0_0_6px_rgba(251,191,36,0.3)]',
      barWidthPercent: pct,
      textColor: 'text-amber-600 dark:text-amber-400 font-medium',
    };
  }

  if (rank && rank <= 1000) {
    const pct = 55 - ((rank - 300) / 700) * 25;
    return {
      tier: 'top1000',
      rankBadgeLabel: `${rank}위`,
      tierName: '유사함',
      icon: '🌱',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-600 dark:text-emerald-400 font-medium',
      badgeBorder: 'border-emerald-300 dark:border-emerald-700',
      barGradient: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      barGlow: 'shadow-[0_0_6px_rgba(16,185,129,0.25)]',
      barWidthPercent: pct,
      textColor: 'text-emerald-600 dark:text-emerald-400',
    };
  }

  // Outside top 1000 or cold
  const coldWidth = Math.max(8, Math.min(28, similarity * 0.32));
  return {
    tier: 'cold',
    rankBadgeLabel: '1000위 밖',
    tierName: '멂',
    icon: '❄️',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800',
    badgeText: 'text-zinc-500 dark:text-zinc-400',
    badgeBorder: 'border-zinc-200 dark:border-zinc-700',
    barGradient: 'bg-gradient-to-r from-slate-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-600',
    barGlow: '',
    barWidthPercent: coldWidth,
    textColor: 'text-zinc-500 dark:text-zinc-400 font-mono',
  };
};

export const GuessList: React.FC<GuessListProps> = ({ myGuesses, allGuesses, currentNickname }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const displayList = activeTab === 'all' ? allGuesses : myGuesses;

  // Excel Mode Table with Conditional Formatting Data Bars
  if (theme === 'excel') {
    return (
      <div className="w-full max-w-5xl mx-auto my-2 px-2 select-none overflow-x-auto">
        <div className="flex items-center space-x-1 border-b border-gray-300 bg-gray-50 text-xs mb-1 px-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 font-sans border-t-2 ${
              activeTab === 'all'
                ? 'border-excel-header bg-white font-semibold text-gray-800'
                : 'border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            모두의 추측 ({allGuesses.length}건)
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-3 py-1 font-sans border-t-2 ${
              activeTab === 'mine'
                ? 'border-excel-header bg-white font-semibold text-gray-800'
                : 'border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            내 입력 ({myGuesses.length}건)
          </button>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs text-left bg-white font-sans">
          <thead>
            <tr className="bg-gray-100 text-gray-600 font-semibold text-[11px]">
              <th className="border border-gray-300 px-2 py-1 w-12 text-center bg-gray-200">#</th>
              <th className="border border-gray-300 px-3 py-1 w-28">작업자</th>
              <th className="border border-gray-300 px-4 py-1">입력 단어</th>
              <th className="border border-gray-300 px-3 py-1 w-24 text-center">순위</th>
              <th className="border border-gray-300 px-4 py-1 w-44">유사도 막대 게이지</th>
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

                    {/* Rank with Icon */}
                    <td className="border border-gray-300 px-3 py-1 text-center font-mono font-bold text-xs">
                      <span className="inline-flex items-center space-x-1">
                        <span>{tier.icon}</span>
                        <span>{tier.rankBadgeLabel}</span>
                      </span>
                    </td>

                    {/* Excel In-Cell Data Bar */}
                    <td className="border border-gray-300 px-2 py-1 relative overflow-hidden">
                      <div className="w-full h-3.5 bg-gray-100 rounded border border-gray-200 overflow-hidden relative">
                        <div
                          className={`h-full rounded ${tier.barGradient} transition-all duration-500`}
                          style={{ width: `${tier.barWidthPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Score */}
                    <td className="border border-gray-300 px-3 py-1 text-right font-mono font-bold">
                      {item.similarity.toFixed(1)}%
                    </td>

                    {/* Verdict */}
                    <td className="border border-gray-300 px-3 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}>
                        {tier.tierName}
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

  // Clean Light & Dark Minimalist List with Prominent Rank and Colorful Dynamic Bar Graphs
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-12">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>모두의 단어 ({allGuesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'mine'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>내 단어 ({myGuesses.length})</span>
          </button>
        </div>

        <span className="text-xs text-zinc-400 font-mono">
          총 {displayList.length}건
        </span>
      </div>

      {/* Rows */}
      {displayList.length === 0 ? (
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs">
          아직 입력된 단어가 없습니다. 위 입력창에서 첫 단어를 입력해보세요.
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayList.map((item, index) => {
            const tier = getRankTierInfo(item.rank, item.similarity, item.isAnswer);
            const isMe = item.nickname === currentNickname;

            return (
              <div
                key={item.id}
                className={`relative border rounded-xl p-3.5 transition-all shadow-xs ${
                  item.isAnswer
                    ? 'border-amber-400/80 bg-amber-500/5 dark:bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                    : tier.tier === 'top10'
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-500/5 dark:bg-rose-500/10'
                    : tier.tier === 'top100'
                    ? 'border-orange-200 dark:border-orange-900/40 bg-orange-500/5 dark:bg-orange-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* 1. Header Row: Index, Word, Notice, Rank Badge, Similarity Score */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-xs font-mono text-zinc-400 w-5 shrink-0 text-center">
                      {index + 1}
                    </span>
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {item.word}
                      </span>

                      {item.notice && (
                        <span
                          className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 truncate"
                          title="단어 자동 정규화/교정"
                        >
                          {item.notice}
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

                  {/* Right Badges: Prominent Rank & Similarity */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Rank Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center space-x-1 ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
                      title={item.rank ? `현재 순위: ${item.rank}위` : '1000위 밖'}
                    >
                      <span className="text-xs">{tier.icon}</span>
                      <span>{tier.rankBadgeLabel}</span>
                    </span>

                    {/* Similarity Score */}
                    <span className={`text-sm font-mono font-bold ${tier.textColor}`}>
                      {item.similarity.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 2. Visual Bar Graph Track */}
                <div className="relative pt-1">
                  <div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/80 dark:border-zinc-700/60 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out relative ${tier.barGradient} ${tier.barGlow}`}
                      style={{ width: `${tier.barWidthPercent}%` }}
                    >
                      {/* Subtle reflection gleam on top ranks */}
                      {(tier.tier === 'answer' || tier.tier === 'top10' || tier.tier === 'top100') && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* 3. Subtitle Row: User & Tier Label */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5 px-0.5">
                    <span className="truncate">
                      작업자:{' '}
                      <b className={isMe ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}>
                        {item.nickname} {isMe && '(나)'}
                      </b>
                    </span>

                    <span className="font-medium text-[11px] flex items-center space-x-1">
                      <span>{tier.tierName}</span>
                      {item.rank && item.rank <= 1000 && (
                        <span className="font-mono opacity-80">({item.rank}/1000위)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
