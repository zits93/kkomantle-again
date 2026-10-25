import React, { useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { useGameSocket } from './hooks/useGameSocket';
import { usePowerMode } from './hooks/usePowerMode';
import { Header } from './components/Header';
import { ExcelRibbon } from './components/ExcelRibbon';
import { WordInput } from './components/WordInput';
import { GuessList } from './components/GuessList';
import { ChatWidget } from './components/ChatWidget';
import { HallOfFameModal } from './components/HallOfFameModal';
import { PowerModeCanvas } from './components/PowerModeCanvas';
import { Sparkles, Trophy, CheckCircle, Info } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { theme } = useTheme();
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);

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
    submitGuess,
    voteOnceMore,
    sendChatMessage,
    setLastWinAlert,
  } = useGameSocket();

  const {
    combo,
    isShaking,
    canvasRef,
    triggerType,
    triggerScoreBurst,
  } = usePowerMode();

  const handleWordSubmit = (word: string) => {
    const res = submitGuess(word);
    if (res) {
      triggerScoreBurst(res.similarity);
    }
  };

  return (
    <div className={`min-h-screen relative flex flex-col ${theme === 'excel' ? 'excel-mode bg-white text-gray-900' : 'glass-gradient-bg text-slate-100'} ${isShaking ? 'shake' : ''}`}>
      {/* Power Mode Canvas (Sparks & Particles) */}
      <PowerModeCanvas canvasRef={canvasRef} />

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

      {/* Winner Notification Banner (Special rule: when others win vs self win) */}
      {lastWinAlert && (
        <div className="w-full max-w-xl mx-auto my-3 px-4 animate-bounce">
          <div className={`p-3 rounded-2xl flex items-center justify-between shadow-xl ${
            lastWinAlert.isSelf
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-xl">{lastWinAlert.isSelf ? '🏆' : '🎉'}</span>
              <span className="text-xs sm:text-sm">
                {lastWinAlert.isSelf
                  ? '축하합니다! 정답을 맞추셨습니다!'
                  : `누군가(${lastWinAlert.winner}님)가 정답을 맞췄습니다! 계속해서 정답에 도전해보세요.`}
              </span>
            </div>
            <button
              onClick={() => setLastWinAlert(null)}
              className="text-xs px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/40 text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start">
        {/* Subtitle / Rules hint (only in Glass mode) */}
        {theme === 'liquid-glass' && (
          <div className="text-center pt-2 px-4">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>숨겨진 오늘의 단어를 찾아보세요 • 유사도가 높을수록 점수가 100에 가까워집니다!</span>
            </span>
          </div>
        )}

        {/* Word Input Box (Formula bar in Excel mode) */}
        <WordInput
          onSubmit={handleWordSubmit}
          onType={triggerType}
          combo={combo}
        />

        {/* Guesses List */}
        <GuessList
          myGuesses={myGuesses}
          allGuesses={allGuesses}
          currentNickname={nickname}
        />
      </main>

      {/* Bottom Right Chat & Announcements Widget */}
      <ChatWidget
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        nickname={nickname}
        isAnswerRevealed={isAnswerRevealed}
        revealedWord={revealedWord}
      />

      {/* Hall of Fame Modal */}
      <HallOfFameModal
        isOpen={isHallOfFameOpen}
        onClose={() => setIsHallOfFameOpen(false)}
        entries={hallOfFame}
        currentNickname={nickname}
      />
    </div>
  );
};
