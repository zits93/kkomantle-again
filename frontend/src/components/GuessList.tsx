import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GuessItem } from '../types/game';
import { Flame, Sparkles, User, Globe, Trophy } from 'lucide-react';

interface GuessListProps {
  myGuesses: GuessItem[];
  allGuesses: GuessItem[];
  currentNickname: string;
}

export const GuessList: React.FC<GuessListProps> = ({ myGuesses, allGuesses, currentNickname }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  const displayList = activeTab === 'all' ? allGuesses : myGuesses;

  // Helper for similarity color & badge
  const getScoreVisual = (sim: number) => {
    if (sim >= 100) {
      return {
        bg: 'from-amber-400 via-yellow-300 to-yellow-500 text-slate-900',
        bar: 'bg-gradient-to-r from-amber-400 to-yellow-500',
        text: 'text-amber-300 font-black',
        icon: '👑',
        label: '정답!'
      };
    }
    if (sim >= 70) {
      return {
        bg: 'from-rose-500 to-orange-500 text-white',
        bar: 'bg-gradient-to-r from-orange-500 to-rose-500',
        text: 'text-rose-400 font-bold',
        icon: '🔥',
        label: '매우 뜨거움'
      };
    }
    if (sim >= 45) {
      return {
        bg: 'from-amber-500 to-yellow-500 text-slate-900',
        bar: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        text: 'text-amber-400 font-semibold',
        icon: '⚡',
        label: '따뜻함'
      };
    }
    return {
      bg: 'from-sky-500 to-indigo-500 text-white',
      bar: 'bg-gradient-to-r from-sky-400 to-indigo-500',
      text: 'text-sky-300',
      icon: '❄️',
      label: '차가움'
    };
  };

  if (theme === 'excel') {
    return (
      <div className="w-full max-w-5xl mx-auto my-2 px-2 select-none overflow-x-auto">
        {/* Excel Tab Bar */}
        <div className="flex items-center space-x-1 border-b border-gray-300 bg-gray-50 text-xs mb-1 px-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 font-sans border-t-2 ${
              activeTab === 'all'
                ? 'border-excel-header bg-white font-semibold text-gray-800'
                : 'border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            모두의 추측 데이터 ({allGuesses.length}건)
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-3 py-1 font-sans border-t-2 ${
              activeTab === 'mine'
                ? 'border-excel-header bg-white font-semibold text-gray-800'
                : 'border-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            내 작업 목록 ({myGuesses.length}건)
          </button>
        </div>

        {/* Excel Grid Table */}
        <table className="w-full border-collapse border border-gray-300 text-xs text-left bg-white font-sans">
          <thead>
            <tr className="bg-gray-100 text-gray-600 font-semibold text-[11px]">
              <th className="border border-gray-300 px-2 py-1 w-12 text-center bg-gray-200">#</th>
              <th className="border border-gray-300 px-3 py-1 w-16 text-center">A (순번)</th>
              <th className="border border-gray-300 px-3 py-1 w-32">B (작업자)</th>
              <th className="border border-gray-300 px-4 py-1">C (입력 단어)</th>
              <th className="border border-gray-300 px-3 py-1 w-28 text-right">D (유사도 점수)</th>
              <th className="border border-gray-300 px-3 py-1 w-24 text-center">E (추정 순위)</th>
              <th className="border border-gray-300 px-3 py-1 w-28 text-center">F (판정)</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 text-center py-8 text-gray-400">
                  입력된 데이터가 없습니다. 상단 수식 입력줄에서 단어를 입력하십시오.
                </td>
              </tr>
            ) : (
              displayList.map((item, index) => {
                const visual = getScoreVisual(item.similarity);
                const isMe = item.nickname === currentNickname;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 ${item.isAnswer ? 'bg-amber-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
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
                      {item.word}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-right font-mono font-bold">
                      {item.similarity.toFixed(1)}%
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-center font-mono text-gray-600">
                      {item.rank ? `${item.rank}위` : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.isAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {visual.label}
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

  // Liquid Glass Mode
  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-12">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="glass-panel p-1 rounded-2xl flex space-x-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>모두의 단어 ({allGuesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'mine'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>내 단어 ({myGuesses.length})</span>
          </button>
        </div>

        <div className="text-xs text-indigo-300/60 font-medium">
          {displayList.length}개의 시도
        </div>
      </div>

      {/* Cards List */}
      {displayList.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 text-2xl">
            💡
          </div>
          <h3 className="text-lg font-bold text-white mb-1">아직 입력된 단어가 없습니다</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            위 입력창에 생각나는 단어(명사, 동사, 부사)를 입력하여 숨겨진 비밀 단어와의 유사도를 확인해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayList.map((item, index) => {
            const visual = getScoreVisual(item.similarity);
            const isMe = item.nickname === currentNickname;

            return (
              <div
                key={item.id}
                className={`glass-panel p-3.5 rounded-2xl transition duration-300 hover:scale-[1.01] relative overflow-hidden group border ${
                  item.isAnswer
                    ? 'border-amber-400/80 shadow-lg shadow-amber-500/20 bg-amber-500/10'
                    : 'border-white/10 hover:border-indigo-400/30'
                }`}
              >
                {/* Background similarity progress fill */}
                <div
                  className={`absolute top-0 bottom-0 left-0 opacity-15 pointer-events-none transition-all duration-700 ${visual.bar}`}
                  style={{ width: `${Math.min(100, Math.max(5, item.similarity))}%` }}
                />

                <div className="relative flex items-center justify-between z-10">
                  {/* Left: Index, Nickname, Word */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-slate-400 w-6 text-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-white tracking-wide">
                          {item.word}
                        </span>
                        {item.isAnswer && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/40 animate-pulse">
                            🎉 정답!
                          </span>
                        )}
                        {item.rank && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-indigo-300 border border-white/10">
                            {item.rank}위
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <span className={isMe ? 'text-pink-400 font-semibold' : ''}>
                          {item.nickname} {isMe && '(나)'}
                        </span>
                        <span>•</span>
                        <span>{visual.icon} {visual.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Similarity Score */}
                  <div className="text-right">
                    <div className={`text-xl font-black font-mono tracking-tight ${visual.text}`}>
                      {item.similarity.toFixed(1)}
                      <span className="text-xs font-normal ml-0.5">%</span>
                    </div>
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
