import { useState, useEffect, useRef, useCallback } from 'react';
import { User, GuessItem, ChatMessage, HallOfFameEntry, VoteState } from '../types/game';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sounds';

// Default mock dictionary for instant client-side standalone capability (Fallback)
const FALLBACK_SECRET_WORDS = [
  '우주', '인공지능', '사과', '행복', '바다', '고양이', '시간', '커피', '음악', '여름',
  '겨울', '사랑', '비행기', '도서관', '컴퓨터', '영화', '지구', '별빛', '모험', '친구'
];

export const useGameSocket = (backendUrl?: string) => {
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('kkomantle_nickname') || `탐험가_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [myGuesses, setMyGuesses] = useState<GuessItem[]>([]);
  const [allGuesses, setAllGuesses] = useState<GuessItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kkomantle_real_hall_of_fame');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [voteState, setVoteState] = useState<VoteState>({
    activeUsers: 1,
    votes: 0,
    requiredVotes: 2,
    hasVoted: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [revealedWord, setRevealedWord] = useState<string>('');
  const [roundId, setRoundId] = useState<string>('round-1');
  const [lastWinAlert, setLastWinAlert] = useState<{ winner: string; isSelf: boolean } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const secretWordRef = useRef<string>(FALLBACK_SECRET_WORDS[0]);

  // Persist nickname
  const updateNickname = (newNick: string) => {
    const trimmed = newNick.trim().slice(0, 12);
    if (!trimmed) return;
    setNickname(trimmed);
    localStorage.setItem('kkomantle_nickname', trimmed);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'change_nickname', nickname: trimmed }));
    }
  };

  // Initial REST fetch for real Hall of Fame data from backend
  useEffect(() => {
    const fetchRealLeaderboard = async () => {
      try {
        const httpUrl = backendUrl
          ? backendUrl.replace('ws://', 'http://').replace('wss://', 'https://')
          : (window.location.protocol === 'https:' ? `${window.location.origin}/api/hall-of-fame` : `http://${window.location.hostname}:8000/api/hall-of-fame`);
        const res = await fetch(httpUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setHallOfFame(data);
            localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(data));
          }
        }
      } catch {
        // Fallback to local storage (already loaded)
      }
    };
    fetchRealLeaderboard();
  }, [backendUrl]);

  // WebSocket connection management
  useEffect(() => {
    const defaultWsUrl = backendUrl || (
      window.location.protocol === 'https:'
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:8000/ws`
    );

    let ws: WebSocket;
    let retryTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(defaultWsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: 'join', nickname }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
          } catch (err) {
            console.error('Failed to parse WS message:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // Fallback to local offline mode
          retryTimer = setTimeout(connect, 4000);
        };

        ws.onerror = () => {
          setIsConnected(false);
          ws.close();
        };
      } catch {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      clearTimeout(retryTimer);
      if (socketRef.current) socketRef.current.close();
    };
  }, [backendUrl]);

  // Process incoming WS data
  const handleIncomingMessage = (data: any) => {
    switch (data.type) {
      case 'init':
      case 'sync_state':
        setRoundId(data.roundId);
        setActiveUsers(data.activeUsers || []);
        setVoteState(data.voteState || { activeUsers: 1, votes: 0, requiredVotes: 2, hasVoted: false });
        if (data.hallOfFame) {
          setHallOfFame(data.hallOfFame);
          localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(data.hallOfFame));
        }
        if (data.chatHistory) setChatMessages(data.chatHistory);
        if (data.allGuesses) setAllGuesses(data.allGuesses);
        break;

      case 'user_list':
        setActiveUsers(data.users);
        setVoteState(prev => ({
          ...prev,
          activeUsers: data.users.length,
          requiredVotes: data.users.length <= 1 ? 1 : 2,
        }));
        break;

      case 'new_guess': {
        const item: GuessItem = data.guess;
        setAllGuesses(prev => [item, ...prev]);
        if (item.nickname === nickname) {
          setMyGuesses(prev => [item, ...prev.filter(g => g.word !== item.word)].sort((a,b) => b.similarity - a.similarity));
        }
        break;
      }

      case 'win_event': {
        // Winner event handling
        const isSelf = data.winnerNickname === nickname;
        setLastWinAlert({ winner: data.winnerNickname, isSelf });

        // Confetti for both
        confetti({
          particleCount: isSelf ? 150 : 60,
          spread: isSelf ? 100 : 60,
          origin: { y: 0.6 },
          colors: isSelf ? ['#fbbf24', '#f59e0b', '#ec4899', '#6366f1'] : ['#38bdf8', '#818cf8']
        });

        if (isSelf) {
          sound.playWinFanfare();
          setIsAnswerRevealed(true);
          setRevealedWord(data.answerWord || '정답');
        } else {
          // 남이 맞춘 경우: 정답 단어는 비공개 유지!
          sound.playSimilarityTone(90);
        }
        break;
      }

      case 'round_reset':
        setRoundId(data.roundId);
        setMyGuesses([]);
        setAllGuesses([]);
        setIsAnswerRevealed(false);
        setRevealedWord('');
        setVoteState(prev => ({ ...prev, votes: 0, hasVoted: false }));
        break;

      case 'chat_message':
        setChatMessages(prev => {
          const updated = [...prev, data.message];
          return updated.slice(-300); // 300 cap
        });
        break;

      case 'hall_of_fame_update':
        setHallOfFame(data.hallOfFame);
        localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(data.hallOfFame));
        break;

      case 'vote_update':
        setVoteState(data.voteState);
        break;

      default:
        break;
    }
  };

  // Client-side fallback similarity calculation (Levensthein + semantic char ngram)
  const calcFallbackSimilarity = (guess: string, target: string): number => {
    if (guess === target) return 100.0;
    // N-gram + common character Jaccard index
    const s1 = new Set(guess);
    const s2 = new Set(target);
    let intersection = 0;
    s1.forEach(c => { if (s2.has(c)) intersection++; });
    const union = new Set([...s1, ...s2]).size;
    const charSim = (intersection / (union || 1)) * 40;

    // Simulated semantic distance
    let hash = 0;
    const combined = guess + target;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    const pseudoSemantic = Math.abs(hash % 50);
    return Math.min(99.4, Math.max(5.0, Number((charSim + pseudoSemantic).toFixed(1))));
  };

  // Submit guess
  const submitGuess = (word: string): GuessItem | null => {
    const trimmed = word.trim();
    if (!trimmed) return null;

    if (isConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'submit_guess', word: trimmed, nickname }));
      return null;
    }

    // Offline / Standalone Mock fallback
    const target = secretWordRef.current;
    const isAnswer = trimmed === target;
    const similarity = isAnswer ? 100.0 : calcFallbackSimilarity(trimmed, target);

    const guessItem: GuessItem = {
      id: `${Date.now()}-${Math.random()}`,
      userId: 'local-me',
      nickname,
      word: trimmed,
      similarity,
      timestamp: Date.now(),
      isSelf: true,
      isAnswer,
      rank: similarity > 95 ? 1 : similarity > 80 ? 45 : similarity > 60 ? 320 : undefined
    };

    setMyGuesses(prev => [guessItem, ...prev.filter(g => g.word !== trimmed)].sort((a,b) => b.similarity - a.similarity));
    setAllGuesses(prev => [guessItem, ...prev]);

    if (isAnswer) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
      sound.playWinFanfare();
      setIsAnswerRevealed(true);
      setRevealedWord(target);
      setHallOfFame(prev => {
        let updated: HallOfFameEntry[];
        const found = prev.find(h => h.nickname === nickname);
        if (found) {
          updated = prev.map(h => h.nickname === nickname ? { ...h, winCount: h.winCount + 1 } : h)
            .sort((a,b) => b.winCount - a.winCount)
            .map((h, i) => ({ ...h, rank: i + 1 }));
        } else {
          updated = [...prev, { rank: prev.length + 1, nickname, winCount: 1 }]
            .sort((a,b) => b.winCount - a.winCount)
            .map((h, i) => ({ ...h, rank: i + 1 }));
        }
        localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(updated));
        return updated;
      });
    }

    return guessItem;
  };

  // Vote "Once More" (한번더)
  const voteOnceMore = () => {
    if (isConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'vote_once_more', nickname }));
      return;
    }

    // Standalone fallback
    const nextIdx = (FALLBACK_SECRET_WORDS.indexOf(secretWordRef.current) + 1) % FALLBACK_SECRET_WORDS.length;
    secretWordRef.current = FALLBACK_SECRET_WORDS[nextIdx];
    setRoundId(`round-${Date.now()}`);
    setMyGuesses([]);
    setAllGuesses([]);
    setIsAnswerRevealed(false);
    setRevealedWord('');
    setVoteState(prev => ({ ...prev, votes: 0, hasVoted: false }));
    setChatMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      type: 'system',
      sender: '시스템',
      text: '새로운 단어로 교체되었습니다! 게임을 다시 시작합니다.',
      timestamp: Date.now()
    }]);
  };

  // Send Chat message
  const sendChatMessage = (text: string, type: ChatMessage['type'] = 'chat') => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'chat', text: trimmed, nickname, msgType: type }));
      return;
    }

    // Standalone fallback
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      sender: nickname,
      text: trimmed,
      timestamp: Date.now(),
      isSelf: true,
    };

    setChatMessages(prev => [...prev.slice(-299), newMsg]);
  };

  return {
    nickname,
    updateNickname,
    activeUsers: activeUsers.length > 0 ? activeUsers : [{ id: 'me', nickname, isSelf: true }],
    myGuesses,
    allGuesses,
    chatMessages,
    hallOfFame,
    voteState,
    isConnected,
    isAnswerRevealed,
    revealedWord,
    roundId,
    lastWinAlert,
    submitGuess,
    voteOnceMore,
    sendChatMessage,
    setLastWinAlert,
  };
};
