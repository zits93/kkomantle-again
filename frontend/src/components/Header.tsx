import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, HallOfFameEntry, VoteState } from '../types/game';
import { Users, Trophy, RotateCcw, Monitor, FileSpreadsheet, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeUsers: User[];
  hallOfFame: HallOfFameEntry[];
  voteState: VoteState;
  onOpenHallOfFame: () => void;
  onVoteOnceMore: () => void;
  nickname: string;
  onChangeNickname: (newNick: string) => void;
  isConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeUsers,
  hallOfFame,
  voteState,
  onOpenHallOfFame,
  onVoteOnceMore,
  nickname,
  onChangeNickname,
  isConnected,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showUsersPopover, setShowUsersPopover] = useState(false);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);

  // Top 3 winners preview
  const topWinners = hallOfFame.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  const handleNickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickInput.trim()) {
      onChangeNickname(nickInput.trim());
      setIsEditingNick(false);
    }
  };

  if (theme === 'excel') {
    return (
      <header className="bg-excel-header text-white px-4 py-2 flex items-center justify-between border-b border-excel-headerDark select-none">
        <div className="flex items-center space-x-3">
          <FileSpreadsheet className="w-5 h-5" />
          <span className="font-semibold text-sm tracking-wide">
            [호환 모드] 꼬맨틀_한번더_업무일지.xlsx - Excel
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${isConnected ? 'bg-emerald-700' : 'bg-amber-700'}`}>
            {isConnected ? '온라인 연결됨' : '로컬 모드'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Active Users */}
          <div
            className="relative cursor-pointer hover:bg-emerald-800 px-2.5 py-1 rounded transition"
            onMouseEnter={() => setShowUsersPopover(true)}
            onMouseLeave={() => setShowUsersPopover(false)}
          >
            <span>공유 작업자: <b>{activeUsers.length}명</b></span>
            {showUsersPopover && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white text-gray-800 rounded shadow-lg border border-gray-200 p-2 z-50">
                <div className="text-[11px] text-gray-400 font-semibold mb-1 pb-1 border-b">현재 공동 편집자</div>
                <ul className="space-y-1">
                  {activeUsers.map(u => (
                    <li key={u.id} className="text-xs truncate flex items-center justify-between">
                      <span className={u.nickname === nickname ? 'font-bold text-excel-header' : ''}>
                        {u.nickname} {u.nickname === nickname && '(나)'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{u.ipMasked || '127.0.0.1'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Hall of fame button */}
          <button
            onClick={onOpenHallOfFame}
            className="hover:bg-emerald-800 px-2 py-1 rounded transition flex items-center space-x-1"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span>실적 순위</span>
          </button>

          {/* Once more button */}
          <button
            onClick={onVoteOnceMore}
            className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-600 px-2.5 py-1 rounded transition font-medium flex items-center space-x-1"
            title={activeUsers.length <= 1 ? '새로운 문제로 즉시 변경' : '2명 이상 동의 시 변경'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>시트 재설정 {activeUsers.length > 1 && `(${voteState.votes}/${voteState.requiredVotes})`}</span>
          </button>

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            className="bg-emerald-900/80 hover:bg-black/30 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center space-x-1 text-emerald-100"
            title="Liquid Glass 테마로 복귀 (Alt+X)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>게임 모드 (Alt+X)</span>
          </button>
        </div>
      </header>
    );
  }

  // Liquid Glass Mode
  return (
    <header className="w-full max-w-5xl mx-auto px-4 pt-6 pb-4 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-xl font-black">
          🎯
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              꼬맨틀 <span className="text-pink-400">한번더</span>
            </h1>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <p className="text-xs text-indigo-200/60 font-medium">단어 유사도 집단 지성 추리 게임</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Nickname pill */}
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center space-x-1.5 text-xs text-indigo-100">
          {isEditingNick ? (
            <form onSubmit={handleNickSubmit} className="flex items-center space-x-1">
              <input
                type="text"
                value={nickInput}
                onChange={e => setNickInput(e.target.value)}
                onBlur={() => setIsEditingNick(false)}
                autoFocus
                className="bg-white/10 rounded px-1.5 py-0.5 text-xs outline-none border border-indigo-400/50 w-24 text-white"
              />
              <button type="submit" className="text-[10px] text-indigo-300 hover:text-white">저장</button>
            </form>
          ) : (
            <span
              onClick={() => setIsEditingNick(true)}
              className="cursor-pointer hover:text-indigo-300 font-semibold"
              title="클릭하여 닉네임 수정"
            >
              👤 {nickname}
            </span>
          )}
        </div>

        {/* Active Users Badge with Popover */}
        <div
          className="relative"
          onMouseEnter={() => setShowUsersPopover(true)}
          onMouseLeave={() => setShowUsersPopover(false)}
        >
          <div className="glass-panel hover:bg-white/10 px-3.5 py-1.5 rounded-full cursor-pointer transition flex items-center space-x-2 text-xs font-medium text-slate-200">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>접속자 <b>{activeUsers.length}</b>명</span>
          </div>

          {/* Hover User Popover */}
          {showUsersPopover && (
            <div className="absolute top-full right-0 mt-2 w-56 glass-panel rounded-2xl p-3 shadow-2xl z-50 border border-indigo-500/20 backdrop-blur-2xl">
              <div className="text-[11px] font-semibold text-indigo-300/80 mb-2 pb-1.5 border-b border-white/10 flex justify-between">
                <span>실시간 접속자</span>
                <span>IP 정보</span>
              </div>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeUsers.map(u => (
                  <li key={u.id} className="text-xs flex items-center justify-between text-slate-200">
                    <span className={u.nickname === nickname ? 'font-bold text-pink-400' : ''}>
                      {u.nickname} {u.nickname === nickname && '(나)'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{u.ipMasked || '127.0.0.1'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hall of Fame Trigger */}
        <button
          onClick={onOpenHallOfFame}
          className="glass-panel hover:bg-white/15 px-3.5 py-1.5 rounded-full transition flex items-center space-x-2 text-xs font-semibold text-amber-200 shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>명예의 전당</span>
          {topWinners.length > 0 && (
            <span className="text-[11px] font-normal text-amber-300/80 ml-1">
              {topWinners.map((w, idx) => `${medals[idx]}${w.nickname.slice(0,3)}`).join(' ')}
            </span>
          )}
        </button>

        {/* Once More (한번더) Voting Button */}
        <button
          onClick={onVoteOnceMore}
          className={`px-3.5 py-1.5 rounded-full transition text-xs font-semibold flex items-center space-x-1.5 shadow-lg ${
            voteState.hasVoted
              ? 'bg-indigo-600/60 text-indigo-200 border border-indigo-400/40 cursor-default'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/20'
          }`}
          title={activeUsers.length <= 1 ? '접속자가 1명이므로 즉시 단어 교체' : '접속자 2명 이상 찬성 시 단어 교체'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>한번더</span>
          {activeUsers.length > 1 && (
            <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
              {voteState.votes}/{voteState.requiredVotes}
            </span>
          )}
        </button>

        {/* Excel Stealth Toggle */}
        <button
          onClick={toggleTheme}
          className="glass-panel hover:bg-white/15 px-3 py-1.5 rounded-full transition text-xs text-slate-300 flex items-center space-x-1"
          title="업무 위장용 엑셀 테마 (단축키: Alt+X 또는 Esc 2회)"
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          <span>엑셀 모드</span>
        </button>
      </div>
    </header>
  );
};
