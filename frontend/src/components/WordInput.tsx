import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Send, Zap, Check } from 'lucide-react';

interface WordInputProps {
  onSubmit: (word: string) => void;
  onType: (rect?: DOMRect) => void;
  combo: number;
  disabled?: boolean;
}

export const WordInput: React.FC<WordInputProps> = ({ onSubmit, onType, combo, disabled }) => {
  const { theme } = useTheme();
  const [word, setWord] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
    if (inputRef.current) {
      onType(inputRef.current.getBoundingClientRect());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = word.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setWord('');
  };

  if (theme === 'excel') {
    return (
      <div className="bg-white border-b border-gray-300 px-3 py-1.5 flex items-center space-x-2 text-xs font-mono">
        <div className="w-16 bg-gray-100 border border-gray-300 px-2 py-1 text-center font-semibold text-gray-700">
          C{combo > 0 ? combo : 4}
        </div>
        <div className="text-gray-400 font-serif italic text-sm font-bold px-1 select-none">
          fx
        </div>
        <form onSubmit={handleSubmit} className="flex-1 flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={handleChange}
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

  // Liquid Glass Mode
  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500 group-focus-within:opacity-80" />

        <div className="relative glass-panel rounded-2xl p-2 flex items-center space-x-3 border border-white/20">
          {/* Combo Streak Badge */}
          {combo > 2 && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs animate-bounce shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{combo} COMBO!</span>
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={word}
            onChange={handleChange}
            placeholder="추측할 단어를 입력하세요 (명사, 동사, 부사 모두 가능)"
            disabled={disabled}
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-slate-400 focus:outline-none text-base md:text-lg font-medium tracking-wide"
          />

          <button
            type="submit"
            disabled={!word.trim() || disabled}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-1.5 shadow-lg shadow-indigo-500/30 transition transform active:scale-95"
          >
            <span>도전</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
