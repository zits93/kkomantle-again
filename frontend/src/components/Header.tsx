import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, HallOfFameEntry, VoteState } from '../types/game';
import { Users, Trophy, RotateCcw, Moon, Sun, FileSpreadsheet, Monitor, Edit2 } from 'lucide-react';

interface HeaderProps {
  activeUsers: User[];
  hallOfFame: HallOfFameEntry[];
  voteState: VoteState;
  onOpenHallOfFame: () => void;
  onVoteOnceMore: () => void;
  nickname: string;
  onChangeNickname: (newNick: string) => void;
  isConnected: boolean;
  onOpenServerSettings?: () => void;
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
  onOpenServerSettings,
}) => {
  const { theme, toggleTheme, toggleExcel } = useTheme();
  const [showUsersPopover, setShowUsersPopover] = useState(false);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);

  const topWinners = hallOfFame.slice(0, 3);
  const medals = ['🥇', '🥈', '🥉'];

  const handleNickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickInput.trim()) {
      onChangeNickname(nickInput.trim());
      setIsEditingNick(false);
    }
  };

  // Excel Mode Header
  if (theme === 'excel') {
    return (
      <header className="bg-excel-header text-white px-4 py-2 flex items-center justify-between border-b border-excel-headerDark select-none">
        <div className="flex items-center space-x-3">
          <FileSpreadsheet className="w-4 h-4" />
          <span className="font-semibold text-xs tracking-wide">
            꼬맨틀_한번더_업무일지.xlsx - Excel
          </span>
          <button
            onClick={onOpenServerSettings}
            className={`text-[10px] px-2 py-0.2 rounded font-mono cursor-pointer hover:opacity-90 ${isConnected ? 'bg-emerald-700' : 'bg-amber-700'}`}
            title="서버 연결 설정"
          >
            {isConnected ? '온라인 연결됨' : '로컬 모드'}
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Active Users */}
          <div
            className="relative cursor-pointer hover:bg-emerald-800 px-2.5 py-1 rounded transition"
            onMouseEnter={() => setShowUsersPopover(true)}
            onMouseLeave={() => setShowUsersPopover(false)}
          >
            <span>공유자: <b>{activeUsers.length}명</b></span>
            {showUsersPopover && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white text-gray-800 rounded shadow-md border border-gray-200 p-2 z-50">
                <div className="text-[11px] text-gray-400 font-semibold mb-1 pb-1 border-b">현재 편집자</div>
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

          <button
            onClick={onOpenHallOfFame}
            className="hover:bg-emerald-800 px-2 py-1 rounded transition flex items-center space-x-1"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300" />
            <span>순위</span>
          </button>

          <button
            onClick={onVoteOnceMore}
            className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-600 px-2 py-1 rounded transition font-medium flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>새 문제 {activeUsers.length > 1 && `(${voteState.votes}/${voteState.requiredVotes})`}</span>
          </button>

          <button
            onClick={toggleExcel}
            className="bg-emerald-900/80 hover:bg-black/30 px-2.5 py-1 rounded border border-emerald-500/30 text-emerald-100"
            title="기본 모드로 복귀 (Alt+X)"
          >
            <span>일반 모드 (Alt+X)</span>
          </button>

          {/* Window Control Buttons */}
          <div className="flex items-center pl-2 border-l border-emerald-700/60 text-emerald-100 text-xs">
            <button onClick={toggleExcel} className="px-2 py-0.5 hover:bg-emerald-800 transition" title="최소화">─</button>
            <button onClick={toggleExcel} className="px-2 py-0.5 hover:bg-emerald-800 transition" title="이전 크기로 복원">□</button>
            <button onClick={toggleExcel} className="px-2.5 py-0.5 hover:bg-red-600 transition" title="닫기 (일반 모드로 복귀)">✕</button>
          </div>
        </div>
      </header>
    );
  }

  // Clean Light & Dark Minimalist Header
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
        {/* Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              꼬맨틀 한번더
            </h1>
            <button
              onClick={onOpenServerSettings}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer text-[10px]"
              title={isConnected ? '실시간 서버 연결됨 (클릭하여 설정)' : '오프라인 모드 (클릭하여 서버 연결)'}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-zinc-500 dark:text-zinc-400 font-medium hidden sm:inline">
                {isConnected ? '온라인' : '오프라인'}
              </span>
            </button>
          </div>

          {/* Nickname pill */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
            {isEditingNick ? (
              <form onSubmit={handleNickSubmit} className="flex items-center space-x-1">
                <input
                  type="text"
                  value={nickInput}
                  onChange={e => setNickInput(e.target.value)}
                  onBlur={() => setIsEditingNick(false)}
                  autoFocus
                  className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none w-24"
                />
                <button type="submit" className="text-zinc-700 dark:text-zinc-300 font-medium">저장</button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingNick(true)}
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition flex items-center space-x-1 font-medium"
                title="닉네임 변경"
              >
                <span>{nickname}</span>
                <Edit2 className="w-3 h-3 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Actions (Hidden on Mobile; MobileBottomBar handles mobile) */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {/* Active Users */}
          <div
            className="relative"
            onMouseEnter={() => setShowUsersPopover(true)}
            onMouseLeave={() => setShowUsersPopover(false)}
          >
            <button className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium flex items-center space-x-1.5 transition">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>접속자 {activeUsers.length}명</span>
            </button>

            {/* Hover Popover */}
            {showUsersPopover && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-lg z-50">
                <div className="text-[11px] font-semibold text-zinc-400 pb-1.5 mb-1 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                  <span>접속자</span>
                  <span>IP</span>
                </div>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {activeUsers.map(u => (
                    <li key={u.id} className="text-xs flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                      <span className={u.nickname === nickname ? 'font-semibold text-zinc-900 dark:text-white' : ''}>
                        {u.nickname} {u.nickname === nickname && '(나)'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">{u.ipMasked || '127.0.0.1'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Hall of Fame / Ranking Trigger */}
          <button
            onClick={onOpenHallOfFame}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium flex items-center space-x-1.5 transition"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>랭킹</span>
            {topWinners.length > 0 && (
              <span className="text-[11px] text-zinc-400 ml-0.5">
                {topWinners.map((w, idx) => `${medals[idx]}${w.nickname.slice(0,2)}`).join(' ')}
              </span>
            )}
          </button>

          {/* Once More (한번더) */}
          <button
            onClick={onVoteOnceMore}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium flex items-center space-x-1.5 transition"
            title={activeUsers.length <= 1 ? '새 단어로 즉시 변경' : '2명 이상 동의 시 변경'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>한번더</span>
            {activeUsers.length > 1 && (
              <span className="bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900 px-1.5 py-0.2 rounded text-[10px] font-mono">
                {voteState.votes}/{voteState.requiredVotes}
              </span>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Excel Stealth Toggle */}
          <button
            onClick={toggleExcel}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition"
            title="업무 위장 엑셀 모드 (Alt+X)"
          >
            <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
