import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { CornerDownLeft } from 'lucide-react';

interface WordInputProps {
  onSubmit: (word: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export const WordInput: React.FC<WordInputProps> = ({ onSubmit, disabled, error }) => {
  const { theme } = useTheme();
  const [word, setWord] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = word.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setWord('');
  };

  // Excel Mode Formula Bar
  if (theme === 'excel') {
    return (
      <div className="bg-white border-b border-gray-300 px-3 py-1.5 flex items-center space-x-2 text-xs font-mono">
        <div className="w-16 bg-gray-100 border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700">
          C4
        </div>
        <div className="text-gray-400 font-serif italic text-sm font-bold px-1 select-none">
          fx
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="단어를 입력하고 Enter를 누르세요 (예: 컴퓨터, 달리다, 빠르게)"
            disabled={disabled}
            className="flex-1 border border-gray-300 focus:border-excel-cellSelected focus:ring-1 focus:ring-excel-cellSelected outline-none px-2.5 py-1 text-xs font-sans text-black"
          />
          <button
            type="submit"
            disabled={!word.trim() || disabled}
            className="bg-excel-header hover:bg-excel-headerDark disabled:opacity-40 text-white px-3 py-1 text-xs font-sans rounded transition"
          >
            입력
          </button>
        </form>
      </div>
    );
  }

  // Clean Light & Dark Minimalist Input
  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm focus-within:border-zinc-900 dark:focus-within:border-zinc-300 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-300 transition-all overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="추측할 단어를 입력하세요 (명사, 동사, 부사)"
            disabled={disabled}
            autoFocus
            className="flex-1 bg-transparent px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none text-base font-normal"
          />

          <button
            type="submit"
            disabled={!word.trim() || disabled}
            className="mr-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs flex items-center space-x-1 transition"
          >
            <span>확인</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
        {error && (
          <p className="text-xs text-rose-500 font-medium mt-1.5 px-2 animate-bounce flex items-center space-x-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
      </form>
    </div>
  );
};
