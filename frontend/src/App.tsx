import React, { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';
import { useGameSocket } from './hooks/useGameSocket';
import { Header } from './components/Header';
import { ExcelRibbon } from './components/ExcelRibbon';
import { ExcelView } from './components/ExcelView';
import { WordInput } from './components/WordInput';
import { GuessList } from './components/GuessList';
import { ChatWidget } from './components/ChatWidget';
import { HallOfFameModal } from './components/HallOfFameModal';
import { ActiveUsersModal } from './components/ActiveUsersModal';
import { MobileBottomBar } from './components/MobileBottomBar';

export const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [lastReadChatId, setLastReadChatId] = useState<string>(() => {
    return localStorage.getItem('kkomantle_last_read_id') || '';
  });

  const {
    nickname,
    updateNickname,
    activeUsers,
    myGuesses,
    allGuesses,
    chatMessages,
    hallOfFame,
    voteState,
    isConnected,
    isAnswerRevealed,
    revealedWord,
    lastWinAlert,
    previousRoundAnswer,
    submitGuess,
    voteOnceMore,
    sendChatMessage,
    setLastWinAlert,
    setPreviousRoundAnswer,
  } = useGameSocket();

  // Compute unread count for bottom bar badge
  const unreadChatCount = React.useMemo(() => {
    if (isChatOpen) return 0;
    if (!lastReadChatId) return chatMessages.length;
    const lastIdx = chatMessages.findIndex(m => m.id === lastReadChatId);
    if (lastIdx === -1) return chatMessages.length;
    return Math.max(0, chatMessages.length - 1 - lastIdx);
  }, [chatMessages, lastReadChatId, isChatOpen]);

  useEffect(() => {
    if (isChatOpen && chatMessages.length > 0) {
      const latest = chatMessages[chatMessages.length - 1];
      setLastReadChatId(latest.id);
      localStorage.setItem('kkomantle_last_read_id', latest.id);
    }
  }, [isChatOpen, chatMessages]);

  const handleWordSubmit = (word: string) => {
    const res = submitGuess(word);
    if (res?.isAnswer) {
      setTimeout(() => {
        setIsHallOfFameOpen(true);
      }, 1000);
    }
  };

  return (
    <div className={`flex flex-col ${
      theme === 'excel'
        ? 'excel-mode bg-white text-gray-900 h-screen overflow-hidden'
        : 'min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'
    }`}>
      {/* Global Header */}
      <Header
        activeUsers={activeUsers}
        hallOfFame={hallOfFame}
        voteState={voteState}
        onOpenHallOfFame={() => setIsHallOfFameOpen(true)}
        onVoteOnceMore={voteOnceMore}
        nickname={nickname}
        onChangeNickname={updateNickname}
        isConnected={isConnected}
      />

      {/* Excel Ribbon Toolbar in Excel Mode */}
      {theme === 'excel' && <ExcelRibbon />}

      {/* Winner Notification Banner */}
      {lastWinAlert && (
        <div className="w-full max-w-xl mx-auto my-3 px-4">
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
            lastWinAlert.isSelf
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
          }`}>
            <span>
              {lastWinAlert.isSelf
                ? '🎉 축하합니다! 정답을 맞추셨습니다!'
                : `📢 누군가(${lastWinAlert.winner}님)가 정답을 맞췄습니다!`}
            </span>
            <button
              onClick={() => setLastWinAlert(null)}
              className="ml-3 px-2 py-0.5 rounded text-xs border border-current opacity-70 hover:opacity-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Previous Round Answer Banner on Round Reset */}
      {previousRoundAnswer && (
        <div className="w-full max-w-xl mx-auto my-2 px-4">
          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 flex items-center justify-between text-xs sm:text-sm font-medium">
            <span>
              🎯 이전 라운드 정답: <b>[{previousRoundAnswer}]</b> (새로운 단어가 출제되었습니다!)
            </span>
            <button
              onClick={() => setPreviousRoundAnswer(null)}
              className="ml-3 px-2 py-0.5 rounded text-xs border border-current opacity-70 hover:opacity-100"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {theme === 'excel' ? (
        <ExcelView
          myGuesses={myGuesses}
          allGuesses={allGuesses}
          currentNickname={nickname}
          onSubmitWord={handleWordSubmit}
        />
      ) : (
        <main className="flex-1 flex flex-col justify-start pb-24 md:pb-12">
          {/* Word Input */}
          <WordInput onSubmit={handleWordSubmit} />

          {/* Guesses List */}
          <GuessList
            myGuesses={myGuesses}
            allGuesses={allGuesses}
            currentNickname={nickname}
          />
        </main>
      )}

      {/* Bottom Right Chat & Announcements */}
      <ChatWidget
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        nickname={nickname}
        isAnswerRevealed={isAnswerRevealed}
        revealedWord={revealedWord}
        isOpen={isChatOpen}
        onOpen={() => setIsChatOpen(true)}
        onClose={() => setIsChatOpen(false)}
        unreadCount={unreadChatCount}
      />

      {/* Hall of Fame Modal */}
      <HallOfFameModal
        isOpen={isHallOfFameOpen}
        onClose={() => setIsHallOfFameOpen(false)}
        entries={hallOfFame}
        currentNickname={nickname}
      />

      {/* Mobile Active Users Modal */}
      <ActiveUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        users={activeUsers}
        currentNickname={nickname}
      />

      {/* Mobile Bottom Navigation Bar (Hidden on desktop & Excel mode) */}
      <MobileBottomBar
        activeUsers={activeUsers}
        voteState={voteState}
        unreadCount={unreadChatCount}
        onOpenUsers={() => setIsUsersModalOpen(true)}
        onOpenHallOfFame={() => setIsHallOfFameOpen(true)}
        onVoteOnceMore={voteOnceMore}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
      />
    </div>
  );
};
