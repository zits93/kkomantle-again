import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage } from '../types/game';
import { MessageSquare, X, Send, Eye, ShieldAlert, Bell } from 'lucide-react';

interface ChatWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, type?: ChatMessage['type']) => void;
  nickname: string;
  isAnswerRevealed: boolean;
  revealedWord: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  onSendMessage,
  nickname,
  isAnswerRevealed,
  revealedWord,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [lastReadId, setLastReadId] = useState<string>(() => {
    return localStorage.getItem('kkomantle_last_read_id') || '';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Calculate unread message count
  const unreadCount = React.useMemo(() => {
    if (isOpen) return 0;
    if (!lastReadId) return messages.length;
    const lastIdx = messages.findIndex(m => m.id === lastReadId);
    if (lastIdx === -1) return messages.length;
    return Math.max(0, messages.length - 1 - lastIdx);
  }, [messages, lastReadId, isOpen]);

  // When chat opens or new message arrives while open, update lastReadId
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const latest = messages[messages.length - 1];
      setLastReadId(latest.id);
      localStorage.setItem('kkomantle_last_read_id', latest.id);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'chat');
    setInputText('');
  };

  const handleRevealAnswer = () => {
    if (window.confirm('정말로 정답을 확인하고 채팅방에 공유하시겠습니까? 이번 라운드가 종료될 수 있습니다.')) {
      onSendMessage('정답 공개 요청을 발송했습니다.', 'answer_reveal');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Toggle Pill / Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`relative p-3.5 rounded-full shadow-2xl transition duration-300 transform hover:scale-105 flex items-center justify-center ${
            theme === 'excel'
              ? 'bg-excel-header text-white hover:bg-excel-headerDark'
              : 'bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-indigo-500/30'
          }`}
          title="실시간 채팅 & 공지"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white animate-pulse border-2 border-slate-900 shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window Box */}
      {isOpen && (
        <div
          className={`w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 ${
            theme === 'excel'
              ? 'bg-white border-gray-400 text-gray-800 font-sans h-[480px]'
              : 'glass-panel border-white/20 text-white h-[500px]'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 flex items-center justify-between border-b ${
              theme === 'excel'
                ? 'bg-excel-header text-white border-excel-headerDark'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span className="font-bold text-sm">실시간 채팅 & 공지</span>
              <span className="text-[10px] opacity-75 font-mono">({messages.length}/300)</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleRevealAnswer}
                className="px-2 py-0.5 rounded text-[11px] bg-amber-500/80 hover:bg-amber-600 text-slate-900 font-semibold flex items-center space-x-1 transition"
                title="정답 확인 및 공개"
              >
                <Eye className="w-3 h-3" />
                <span>정답 공개</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Answer Banner if revealed */}
          {isAnswerRevealed && (
            <div className="bg-amber-500/20 border-b border-amber-500/30 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between">
              <span>🎯 현재 라운드 정답: <b>{revealedWord}</b></span>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                채팅 메시지가 없습니다. 첫 대화를 남겨보세요!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === nickname;
                const isSystem = msg.type === 'system' || msg.type === 'notice';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-medium">
                        📢 {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 font-medium px-1">
                      {msg.sender} {isMe && '(나)'}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-1.5 break-words ${
                        isMe
                          ? theme === 'excel'
                            ? 'bg-excel-header text-white rounded-tr-none'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none shadow-md'
                          : theme === 'excel'
                          ? 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
                          : 'bg-white/10 text-slate-100 rounded-tl-none border border-white/10'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSend}
            className={`p-2.5 border-t flex items-center space-x-2 ${
              theme === 'excel' ? 'border-gray-300 bg-gray-50' : 'border-white/10 bg-white/5'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className={`flex-1 rounded-xl px-3 py-1.5 text-xs outline-none transition ${
                theme === 'excel'
                  ? 'bg-white border border-gray-300 text-black focus:border-excel-header'
                  : 'bg-white/10 border border-white/15 text-white placeholder-slate-400 focus:border-indigo-400'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-xl transition disabled:opacity-40 ${
                theme === 'excel'
                  ? 'bg-excel-header hover:bg-excel-headerDark text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
