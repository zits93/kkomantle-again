import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage } from '../types/game';
import { MessageSquare, X, Send } from 'lucide-react';

interface ChatWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, type?: ChatMessage['type']) => void;
  nickname: string;
  isAnswerRevealed: boolean;
  revealedWord: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  unreadCount?: number;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  onSendMessage,
  nickname,
  isAnswerRevealed,
  revealedWord,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
  unreadCount: controlledUnreadCount,
}) => {
  const { theme } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleOpen = controlledOnOpen || (() => setInternalIsOpen(true));
  const handleClose = controlledOnClose || (() => setInternalIsOpen(false));

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayUnread = controlledUnreadCount !== undefined ? controlledUnreadCount : 0;

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), 'chat');
    setInputText('');
  };

  return (
    <>
      {/* Floating Toggle Button (Desktop only on standard theme, hidden on mobile) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 select-none hidden md:block">
          <button
            onClick={handleOpen}
            className={`relative shadow-lg transition-transform hover:scale-105 flex items-center justify-center ${
              theme === 'excel'
                ? 'px-3 py-1.5 rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 text-xs font-sans space-x-1.5'
                : 'p-3 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            }`}
            title="채팅"
          >
            <MessageSquare className="w-4 h-4" />
            {theme === 'excel' && <span className="font-medium">공동 메모</span>}
            {displayUnread > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono ${
                theme === 'excel' ? 'ml-1' : 'absolute -top-1 -right-1 border-2 border-white dark:border-zinc-900'
              }`}>
                {displayUnread > 99 ? '99+' : displayUnread}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window: Desktop floating box / Mobile bottom-sheet modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-start md:block md:inset-auto md:bottom-5 md:right-5 select-none bg-black/40 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none">
          {/* Backdrop dismiss for mobile */}
          <div
            className="md:hidden absolute inset-0 -z-10"
            onClick={handleClose}
          />

          <div
            className={`w-full md:w-88 rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden border transition-all h-[75vh] md:h-[440px] ${
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
                <span className="font-semibold text-xs">채팅</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleClose}
                  aria-label="채팅창 닫기"
                  className={`p-1 rounded transition ${
                    theme === 'excel'
                      ? 'text-white hover:bg-emerald-800'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
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
                      <div key={msg.id} className="text-center my-1.5">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-[11px]">
                          <span>{msg.text}</span>
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
              <label htmlFor="chat-message-input" className="sr-only">
                채팅 메시지
              </label>
              <input
                id="chat-message-input"
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="메시지 입력..."
                className={`flex-1 rounded-md px-2.5 h-9 text-xs outline-none ${
                  theme === 'excel'
                    ? 'bg-white border border-gray-300 text-black'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-zinc-400'
                }`}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                aria-label="메시지 전송"
                className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-md transition disabled:opacity-40 cursor-pointer ${
                  theme === 'excel'
                    ? 'bg-excel-header text-white hover:bg-emerald-800'
                    : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
