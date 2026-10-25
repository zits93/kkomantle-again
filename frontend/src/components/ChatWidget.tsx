import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage } from '../types/game';
import { MessageSquare, X, Send, Eye } from 'lucide-react';

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

  // Calculate unread count
  const unreadCount = React.useMemo(() => {
    if (isOpen) return 0;
    if (!lastReadId) return messages.length;
    const lastIdx = messages.findIndex(m => m.id === lastReadId);
    if (lastIdx === -1) return messages.length;
    return Math.max(0, messages.length - 1 - lastIdx);
  }, [messages, lastReadId, isOpen]);

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
    if (window.confirm('정답을 확인하고 채팅방에 공개하시겠습니까?')) {
      onSendMessage('정답 공개 요청을 발송했습니다.', 'answer_reveal');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`relative shadow-lg transition-transform hover:scale-105 flex items-center justify-center ${
            theme === 'excel'
              ? 'px-3 py-1.5 rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 text-xs font-sans space-x-1.5'
              : 'p-3 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          }`}
          title="채팅 및 공지"
        >
          <MessageSquare className="w-4 h-4" />
          {theme === 'excel' && <span className="font-medium">공동 메모</span>}
          {unreadCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono ${
              theme === 'excel' ? 'ml-1' : 'absolute -top-1 -right-1 border-2 border-white dark:border-zinc-900'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window Box */}
      {isOpen && (
        <div
          className={`w-80 sm:w-88 rounded-xl shadow-xl flex flex-col overflow-hidden border transition-all h-[440px] ${
            theme === 'excel'
              ? 'bg-white border-gray-400 text-gray-800 font-sans'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
          }`}
        >
          {/* Header */}
          <div
            className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
              theme === 'excel'
                ? 'bg-excel-header text-white border-excel-headerDark'
                : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs">채팅 및 공지</span>
              <span className="text-[10px] text-zinc-400 font-mono">({messages.length}/300)</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleRevealAnswer}
                className="px-2 py-0.5 rounded text-[10px] border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium flex items-center space-x-1"
                title="정답 확인 및 공개"
              >
                <Eye className="w-3 h-3" />
                <span>정답 공개</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Answer Banner */}
          {isAnswerRevealed && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>정답: <b>{revealedWord}</b></span>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
                채팅 메시지가 없습니다.
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === nickname;
                const isSystem = msg.type === 'system' || msg.type === 'notice';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-1">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px]">
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
                    <span className="text-[10px] text-zinc-400 mb-0.5 font-medium px-1">
                      {msg.sender} {isMe && '(나)'}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-1.5 break-words ${
                        isMe
                          ? theme === 'excel'
                            ? 'bg-excel-header text-white'
                            : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : theme === 'excel'
                          ? 'bg-gray-100 text-gray-800 border border-gray-200'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
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

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className={`p-2 border-t flex items-center space-x-1.5 ${
              theme === 'excel' ? 'border-gray-300 bg-gray-50' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="메시지 입력..."
              className={`flex-1 rounded-md px-2.5 py-1 text-xs outline-none ${
                theme === 'excel'
                  ? 'bg-white border border-gray-300 text-black'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-zinc-400'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-1.5 rounded-md transition disabled:opacity-40 ${
                theme === 'excel'
                  ? 'bg-excel-header text-white'
                  : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
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
