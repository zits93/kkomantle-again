import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, HallOfFameEntry, VoteState } from '../types/game';
import { Users, Trophy, RotateCcw, Moon, Sun, FileSpreadsheet, Monitor, Edit2 } from 'lucide-react';
import { getExcelWeekTitle } from '../utils/excelTitle';

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
  onOpenNicknameModal?: () => void;
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
  onOpenNicknameModal,
}) => {
  const { theme, preference, toggleTheme, toggleExcel } = useTheme();
  const [showUsersPopover, setShowUsersPopover] = useState(false);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);

  const topWinners = hallOfFame.slice(0, 3);

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
            {getExcelWeekTitle()}
          </span>
          <div
            className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/30 text-[10px] select-none"
            title={isConnected ? '서버 연결됨' : '서버 연결 끊김'}
          >
            <span className={`block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="font-mono text-emerald-100">{isConnected ? '온라인' : '오프라인'}</span>
          </div>
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
            <button type="button" className="px-2 py-0.5 hover:bg-emerald-800 transition opacity-60 cursor-default" title="지원되지 않는 기능입니다">─</button>
            <button type="button" className="px-2 py-0.5 hover:bg-emerald-800 transition opacity-60 cursor-default" title="지원되지 않는 기능입니다">□</button>
            <button type="button" onClick={toggleExcel} className="px-2.5 py-0.5 hover:bg-red-600 transition" title="닫기 (일반 모드로 복귀)">✕</button>
          </div>
        </div>
      </header>
    );
  }

  // Clean Light & Dark Minimalist Header
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 dark:bg-zinc-950/85 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-2xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Title (Left) */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex items-center space-x-2 shrink-0">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              꼬맨틀 한번더
            </h1>
            <div
              className="p-1 flex items-center justify-center select-none"
              title={isConnected ? '서버 연결됨' : '서버 연결 끊김'}
              aria-label={isConnected ? '서버 연결됨' : '서버 연결 끊김'}
            >
              {isConnected ? (
                <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              )}
            </div>
          </div>

          {/* Desktop Nickname pill: next to title */}
          <div className="hidden md:flex text-xs text-zinc-500 dark:text-zinc-400 items-center pl-2.5 border-l border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onOpenNicknameModal || (() => setIsEditingNick(true))}
              className="px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center space-x-1.5 font-medium cursor-pointer active:scale-95 motion-reduce:transform-none"
              title="닉네임 변경 및 확인"
            >
              <span className="truncate max-w-[140px]">{nickname}</span>
              <Edit2 className="w-3 h-3 text-zinc-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobile Right Nickname pill: Right-aligned on mobile */}
        <div className="flex md:hidden items-center shrink-0">
          <button
            onClick={onOpenNicknameModal || (() => setIsEditingNick(true))}
            className="px-2.5 py-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center space-x-1.5 text-xs font-medium cursor-pointer shadow-xs min-h-[32px] active:scale-95 motion-reduce:transform-none"
            title="닉네임 변경 및 확인"
          >
            <span className="truncate max-w-[110px]">{nickname}</span>
            <Edit2 className="w-3 h-3 text-zinc-400 shrink-0" />
          </button>
        </div>

        {/* Desktop Actions (Hidden on Mobile; MobileBottomBar handles mobile) */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {/* Active Users */}
          <div
            className="relative"
            onMouseEnter={() => setShowUsersPopover(true)}
            onMouseLeave={() => setShowUsersPopover(false)}
          >
            <button className="px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium flex items-center space-x-1.5 transition-all active:scale-95 shadow-xs cursor-pointer motion-reduce:transform-none">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>접속자 {activeUsers.length}명</span>
            </button>

            {/* Hover Popover */}
            {showUsersPopover && (
              <div className="absolute top-full right-0 mt-1.5 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] z-50">
                <div className="text-[11px] font-semibold text-zinc-400 pb-1.5 mb-1.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                  <span>접속자</span>
                  <span>IP</span>
                </div>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {activeUsers.map(u => (
                    <li key={u.id} className="text-xs flex items-center justify-between text-zinc-700 dark:text-zinc-300 py-0.5">
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
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium flex items-center space-x-1.5 transition-all active:scale-95 shadow-xs cursor-pointer motion-reduce:transform-none"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>랭킹</span>
            {topWinners.length > 0 && (
              <span className="text-[11px] text-zinc-400 font-mono ml-0.5">
                ({topWinners.length})
              </span>
            )}
          </button>

          {/* Once More (한번더) */}
          <button
            onClick={onVoteOnceMore}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 hover:from-zinc-700 hover:to-zinc-900 dark:hover:from-white dark:hover:to-zinc-100 font-medium flex items-center space-x-1.5 shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer motion-reduce:transform-none"
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
            className="p-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer shadow-xs motion-reduce:transform-none"
            title={
              preference === 'system'
                ? `현재 시스템 테마 적용 중 (${theme === 'dark' ? '다크' : '라이트'}) · 클릭 시 전환`
                : theme === 'dark'
                ? '라이트 모드로 전환'
                : '다크 모드로 전환'
            }
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* Excel Stealth Toggle */}
          <button
            onClick={toggleExcel}
            className="p-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-all active:scale-95 cursor-pointer shadow-xs motion-reduce:transform-none"
            title="업무 위장 엑셀 모드 (Alt+X)"
          >
            <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
