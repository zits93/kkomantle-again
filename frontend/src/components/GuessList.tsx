import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GuessItem } from '../types/game';
import { Globe, User, CheckCircle2 } from 'lucide-react';

interface GuessListProps {
  myGuesses: GuessItem[];
  allGuesses: GuessItem[];
  currentNickname: string;
}

export const GuessList: React.FC<GuessListProps> = ({ myGuesses, allGuesses, currentNickname }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const displayList = activeTab === 'all' ? allGuesses : myGuesses;

  // Clean, muted color indicators (anti-AI slop)
  const getScoreStyle = (sim: number) => {
    if (sim >= 100) {
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400 font-bold',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        label: '정답'
      };
    }
    if (sim >= 70) {
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400 font-semibold',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        label: '매우 근접'
      };
    }
    if (sim >= 45) {
      return {
        bar: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        label: '근접'
      };
    }
    return {
      bar: 'bg-zinc-400 dark:bg-zinc-600',
      text: 'text-zinc-600 dark:text-zinc-400',
      badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
      label: '멂'
    };
  };

  // Excel Mode Table
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
              <th className="border border-gray-300 px-3 py-1 w-16 text-center">순번</th>
              <th className="border border-gray-300 px-3 py-1 w-32">작업자</th>
              <th className="border border-gray-300 px-4 py-1">입력 단어</th>
              <th className="border border-gray-300 px-3 py-1 w-28 text-right">유사도 점수</th>
              <th className="border border-gray-300 px-3 py-1 w-24 text-center">순위</th>
              <th className="border border-gray-300 px-3 py-1 w-28 text-center">판정</th>
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
                const style = getScoreStyle(item.similarity);
                const isMe = item.nickname === currentNickname;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 ${item.isAnswer ? 'bg-emerald-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                  >
                    <td className="border border-gray-300 px-2 py-1 text-center bg-gray-100 text-gray-400 font-mono text-[10px]">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-center font-mono text-gray-500">
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
                    <td className="border border-gray-300 px-3 py-1 text-right font-mono font-bold">
                      {item.similarity.toFixed(1)}%
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-center font-mono text-gray-600">
                      {item.rank ? `${item.rank}위` : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.isAnswer ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                        {style.label}
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

  // Clean Light & Dark Minimalist List
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
        <div className="space-y-1.5">
          {displayList.map((item, index) => {
            const style = getScoreStyle(item.similarity);
            const isMe = item.nickname === currentNickname;

            return (
              <div
                key={item.id}
                className={`relative border rounded-lg p-3 transition-colors ${
                  item.isAnswer
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Subtle progress indicator bar at the bottom edge */}
                <div
                  className={`absolute bottom-0 left-0 h-0.5 rounded-b-lg transition-all ${style.bar}`}
                  style={{ width: `${Math.min(100, Math.max(4, item.similarity))}%` }}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-zinc-400 w-5 text-center">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.word}
                        </span>
                        {item.notice && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700" title="단어 자동 정규화/교정">
                            {item.notice}
                          </span>
                        )}
                        {item.isAnswer && (
                          <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>정답</span>
                          </span>
                        )}
                        {item.rank && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {item.rank}위
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center space-x-1.5">
                        <span className={isMe ? 'font-medium text-zinc-700 dark:text-zinc-300' : ''}>
                          {item.nickname} {isMe && '(나)'}
                        </span>
                        <span>•</span>
                        <span>{style.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Similarity Percentage */}
                  <div className="text-right">
                    <span className={`text-base font-mono font-bold ${style.text}`}>
                      {item.similarity.toFixed(1)}%
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
