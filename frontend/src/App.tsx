import React, { useState, useEffect } from 'react';
import { WifiOff, Sparkles, Volume2, Target, CheckCircle2 } from 'lucide-react';
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
import { ServerSettingsModal } from './components/ServerSettingsModal';
import { NicknameModal } from './components/NicknameModal';

export const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(() => {
    return !localStorage.getItem('kkomantle_nickname_confirmed');
  });

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
    isHttpFallback,
    isAnswerRevealed,
    revealedWord,
    lastWinAlert,
    previousRoundAnswer,
    submitGuess,
    voteOnceMore,
    sendChatMessage,
    setLastWinAlert,
    setPreviousRoundAnswer,
    serverHost,
    updateServerHost,
    guessError,
    gameStats,
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
        isHttpFallback={isHttpFallback}
        onOpenServerSettings={() => setIsServerModalOpen(true)}
        onOpenNicknameModal={() => setIsNicknameModalOpen(true)}
      />

      {/* Persistent Offline Warning Banner when Disconnected */}
      {!isConnected && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
          <div className="flex items-center space-x-1.5 min-w-0">
            <WifiOff className="w-3.5 h-3.5 shrink-0 opacity-80" />
            <span className="truncate">서버와 연결이 끊어졌습니다 (사내망 프록시/방화벽 차단).</span>
          </div>
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="shrink-0 ml-2 px-2.5 py-1 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold cursor-pointer text-[11px] transition active:scale-95 shadow-xs motion-reduce:transform-none"
          >
            연결 진단 / 서버 설정
          </button>
        </div>
      )}

      {/* Excel Ribbon Toolbar in Excel Mode */}
      {theme === 'excel' && <ExcelRibbon />}

      {/* Winner Notification Banner */}
      {lastWinAlert && (
        <div className="w-full max-w-2xl mx-auto my-3 px-4">
          <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all ${
            lastWinAlert.isSelf
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.18)]'
              : 'bg-zinc-100/90 dark:bg-zinc-900/90 border-zinc-300/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
          }`}>
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              {lastWinAlert.isSelf ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="leading-snug break-keep font-semibold">축하합니다! 정답을 맞추셨습니다!</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="leading-snug break-keep">{lastWinAlert.winner}님이 정답을 맞췄습니다!</span>
                </>
              )}
            </div>
            <button
              onClick={() => setLastWinAlert(null)}
              className="shrink-0 min-w-[56px] h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap border border-current opacity-85 hover:opacity-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs motion-reduce:transform-none"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Previous Round Answer Banner on Round Reset */}
      {previousRoundAnswer && (
        <div className="w-full max-w-2xl mx-auto my-2 px-4">
          <div className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/70 backdrop-blur-md text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <Target className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="leading-snug break-keep text-xs sm:text-sm">
                <span>이전 라운드 정답: </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">[{previousRoundAnswer}]</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-xs ml-1 block sm:inline font-normal">새로운 단어가 출제되었습니다</span>
              </div>
            </div>
            <button
              onClick={() => setPreviousRoundAnswer(null)}
              className="shrink-0 min-w-[56px] h-8 px-3 rounded-xl text-xs font-semibold whitespace-nowrap bg-white dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer motion-reduce:transform-none"
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
          gameStats={gameStats}
        />
      ) : (
        <main className="flex-1 flex flex-col justify-start pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-12">
          {/* Word Input */}
          <WordInput onSubmit={handleWordSubmit} error={guessError} gameStats={gameStats} />

          {/* Guesses List */}
          <GuessList
            myGuesses={myGuesses}
            allGuesses={allGuesses}
            currentNickname={nickname}
            gameStats={gameStats}
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

      {/* Server Connection & Multiplayer Sync Modal */}
      <ServerSettingsModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        isConnected={isConnected}
        currentServer={serverHost}
        onSaveServer={updateServerHost}
      />

      {/* Nickname & Existing User IP Verification Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        currentNickname={nickname}
        serverHost={serverHost}
        onConfirmNickname={updateNickname}
        canDismiss={Boolean(localStorage.getItem('kkomantle_nickname_confirmed'))}
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
