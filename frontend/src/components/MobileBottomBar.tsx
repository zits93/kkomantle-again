import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { User, VoteState } from '../types/game';
import { Users, Trophy, RotateCcw, MessageSquare, Sun, Moon } from 'lucide-react';

interface MobileBottomBarProps {
  activeUsers: User[];
  voteState: VoteState;
  unreadCount: number;
  onOpenUsers: () => void;
  onOpenHallOfFame: () => void;
  onVoteOnceMore: () => void;
  onToggleChat: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeUsers,
  voteState,
  unreadCount,
  onOpenUsers,
  onOpenHallOfFame,
  onVoteOnceMore,
  onToggleChat,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Don't render on Excel mode
  if (theme === 'excel') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80 px-3 py-1.5 flex items-center justify-between text-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors">
      {/* 1. Active Users */}
      <button
        onClick={onOpenUsers}
        className="flex-1 flex flex-col items-center justify-center py-1 text-zinc-600 dark:text-zinc-400 active:scale-90 transition-transform duration-150 cursor-pointer motion-reduce:transform-none"
      >
        <div className="relative">
          <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-mono bg-zinc-200/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xs">
            {activeUsers.length}
          </span>
        </div>
        <span className="text-[10px] mt-0.5 font-medium">접속자</span>
      </button>

      {/* 2. Hall of Fame */}
      <button
        onClick={onOpenHallOfFame}
        className="flex-1 flex flex-col items-center justify-center py-1 text-zinc-600 dark:text-zinc-400 active:scale-90 transition-transform duration-150 cursor-pointer motion-reduce:transform-none"
      >
        <Trophy className="w-5 h-5 text-amber-500" />
        <span className="text-[10px] mt-0.5 font-medium">랭킹</span>
      </button>

      {/* 3. Once More (Center Highlighted Button) */}
      <div className="flex-1 flex items-center justify-center px-1">
        <button
          onClick={onVoteOnceMore}
          className="w-full max-w-[84px] py-1.5 px-2 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-200 text-white dark:text-zinc-900 shadow-md hover:shadow-lg active:scale-90 transition-all flex flex-col items-center justify-center cursor-pointer motion-reduce:transform-none"
          title={activeUsers.length <= 1 ? '새로운 단어로 즉시 변경' : '2명 이상 동의 시 변경'}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5 flex items-center space-x-0.5">
            <span>한번더</span>
            {activeUsers.length > 1 && (
              <span className="text-[9px] opacity-80 font-mono">
                {voteState.votes}/{voteState.requiredVotes}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* 4. Chat */}
      <button
        onClick={onToggleChat}
        className="flex-1 flex flex-col items-center justify-center py-1 text-zinc-600 dark:text-zinc-400 active:scale-90 transition-transform duration-150 relative cursor-pointer motion-reduce:transform-none"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white font-mono shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-medium">채팅</span>
      </button>

      {/* 5. Theme */}
      <button
        onClick={toggleTheme}
        className="flex-1 flex flex-col items-center justify-center py-1 text-zinc-600 dark:text-zinc-400 active:scale-90 transition-transform duration-150 cursor-pointer motion-reduce:transform-none"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-600" />
        )}
        <span className="text-[10px] mt-0.5 font-medium">{theme === 'dark' ? '라이트' : '다크'}</span>
      </button>
    </nav>
  );
};
