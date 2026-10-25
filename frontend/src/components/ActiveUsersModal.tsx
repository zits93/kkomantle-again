import React from 'react';
import { User } from '../types/game';
import { Users, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface ActiveUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentNickname: string;
}

export const ActiveUsersModal: React.FC<ActiveUsersModalProps> = ({
  isOpen,
  onClose,
  users,
  currentNickname,
}) => {
  const modalRef = useModalA11y<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md select-none">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-users-title"
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <h2 id="active-users-title" className="font-bold text-xs tracking-tight">실시간 접속자 ({users.length}명)</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all active:scale-95 text-zinc-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User list */}
        <div className="p-3 max-h-60 overflow-y-auto space-y-1.5">
          {users.map(u => (
            <div
              key={u.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                u.nickname === currentNickname
                  ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{u.nickname}</span>
                {u.nickname === currentNickname && (
                  <span className="text-[10px] text-zinc-400 font-normal">(나)</span>
                )}
              </div>
              <span className="text-[11px] font-mono text-zinc-400">{u.ipMasked || '127.0.0.1'}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
