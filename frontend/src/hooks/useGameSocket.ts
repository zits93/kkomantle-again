import { useState, useEffect, useRef, useCallback } from 'react';
import { User, GuessItem, ChatMessage, HallOfFameEntry, VoteState, GameStats } from '../types/game';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sounds';

// Expanded Korean dictionary pool for standalone/client gameplay (nouns, verbs, adverbs)
const FALLBACK_SECRET_WORDS = [
  '인공지능', '우주', '알고리즘', '행복', '바다', '고양이', '시간', '커피', '음악', '여름',
  '겨울', '사랑', '비행기', '도서관', '컴퓨터', '영화', '지구', '별빛', '모험', '친구',
  '스마트폰', '클라우드', '블록체인', '메타버스', '오로라', '무지개', '은하', '강아지', '설렘',
  '희망', '가족', '여행', '디자인', '사진', '생각하다', '달리다', '꿈꾸다', '노래하다', '만들다',
  '사랑하다', '이해하다', '빠르게', '천천히', '조용히', '반짝반짝', '다정하게', '영원히', '마침내', '가득'
];

export const resolveServerHost = (): string => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const param = params.get('server') || params.get('ws');
  if (param) {
    const clean = param.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/ws\/?$/, '');
    localStorage.setItem('kkomantle_backend_server', clean);
    return clean;
  }
  const saved = localStorage.getItem('kkomantle_backend_server');
  if (saved) return saved;

  const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
  if (envWsUrl) {
    return envWsUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/ws\/?$/, '');
  }

  if (window.location.hostname.includes('github.io')) {
    return '7b27-211-177-123-232.ngrok-free.app';
  }

  return `${window.location.hostname}:8000`;
};

export const useGameSocket = (backendUrl?: string) => {
  const [serverHost, setServerHostState] = useState<string>(() => backendUrl || resolveServerHost());

  const updateServerHost = (newHost: string) => {
    const clean = newHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/ws\/?$/, '').trim();
    if (clean) {
      localStorage.setItem('kkomantle_backend_server', clean);
      setServerHostState(clean);
    }
  };

  const [guessError, setGuessError] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('kkomantle_nickname') || `탐험가_${Math.floor(1000 + Math.random() * 9000)}`;
  });

  // Load persisted current roundId
  const [roundId, setRoundId] = useState<string>(() => {
    return localStorage.getItem('kkomantle_round_id') || 'round-1';
  });

  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  // Load persisted guesses for the current round
  const [allGuesses, setAllGuesses] = useState<GuessItem[]>(() => {
    try {
      const curRound = localStorage.getItem('kkomantle_round_id') || 'round-1';
      const saved = localStorage.getItem(`kkomantle_all_guesses_${curRound}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [myGuesses, setMyGuesses] = useState<GuessItem[]>(() => {
    try {
      const curRound = localStorage.getItem('kkomantle_round_id') || 'round-1';
      const saved = localStorage.getItem(`kkomantle_my_guesses_${curRound}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('kkomantle_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
  const [lastWinAlert, setLastWinAlert] = useState<{ winner: string; isSelf: boolean } | null>(null);
  const [previousRoundAnswer, setPreviousRoundAnswer] = useState<string | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalWords: 119656,
    top1000Cutoff: 24.0,
    top100Cutoff: 45.0,
    top10Cutoff: 58.0,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Standalone secret word initialized from localStorage
  const secretWordRef = useRef<string>((() => {
    const saved = localStorage.getItem('kkomantle_secret_word');
    if (saved && FALLBACK_SECRET_WORDS.includes(saved)) {
      return saved;
    }
    const initWord = FALLBACK_SECRET_WORDS[0];
    localStorage.setItem('kkomantle_secret_word', initWord);
    return initWord;
  })());

  // Helpers to atomically update state and localStorage
  const saveAllGuesses = useCallback((updater: (prev: GuessItem[]) => GuessItem[], targetRound?: string) => {
    setAllGuesses(prev => {
      const next = updater(prev);
      const rId = targetRound || localStorage.getItem('kkomantle_round_id') || 'round-1';
      try {
        localStorage.setItem(`kkomantle_all_guesses_${rId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const saveMyGuesses = useCallback((updater: (prev: GuessItem[]) => GuessItem[], targetRound?: string) => {
    setMyGuesses(prev => {
      const next = updater(prev);
      const rId = targetRound || localStorage.getItem('kkomantle_round_id') || 'round-1';
      try {
        localStorage.setItem(`kkomantle_my_guesses_${rId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Update and persist nickname
  const updateNickname = (newNick: string) => {
    const trimmed = newNick.trim().slice(0, 12);
    if (!trimmed) return;
    setNickname(trimmed);
    localStorage.setItem('kkomantle_nickname', trimmed);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'change_nickname', nickname: trimmed }));
    }
  };

  // Cross-Tab Realtime Synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('kkomantle_cross_tab_sync');
      channelRef.current = ch;

      ch.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'SYNC_NEW_GUESS' && data.guess) {
          const item: GuessItem = data.guess;
          saveAllGuesses(prev => {
            if (prev.some(g => g.id === item.id || (g.word === item.word && g.nickname === item.nickname))) {
              return prev;
            }
            return [item, ...prev];
          }, data.roundId);

          if (item.nickname === nickname) {
            saveMyGuesses(prev => {
              if (prev.some(g => g.id === item.id || g.word === item.word)) return prev;
              return [item, ...prev.filter(g => g.word !== item.word)].sort((a,b) => b.similarity - a.similarity);
            }, data.roundId);
          }
        } else if (data.type === 'SYNC_ROUND_RESET') {
          setRoundId(data.roundId);
          localStorage.setItem('kkomantle_round_id', data.roundId);
          if (data.newSecretWord) {
            secretWordRef.current = data.newSecretWord;
            localStorage.setItem('kkomantle_secret_word', data.newSecretWord);
          }
          setMyGuesses([]);
          setAllGuesses([]);
          setIsAnswerRevealed(false);
          setRevealedWord('');
          setVoteState(prev => ({ ...prev, votes: 0, hasVoted: false }));
          if (data.previousAnswer) {
            setPreviousRoundAnswer(data.previousAnswer);
          }
        } else if (data.type === 'SYNC_CHAT' && data.message) {
          setChatMessages(prev => {
            const next = [...prev, data.message].slice(-300);
            try { localStorage.setItem('kkomantle_chat_messages', JSON.stringify(next)); } catch {}
            return next;
          });
        }
      };

      return () => {
        ch.close();
      };
    }
  }, [nickname, saveAllGuesses, saveMyGuesses]);

  // Initial REST fetch for real server state (game-state & hall-of-fame)
  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const isSecure = window.location.protocol === 'https:' || serverHost.includes('ngrok') || serverHost.includes('trycloudflare');
        const baseHttp = `${isSecure ? 'https://' : 'http://'}${serverHost}`;
        const headers = { 'ngrok-skip-browser-warning': '1' };

        // 1. Fetch Hall of Fame
        const hofRes = await fetch(`${baseHttp}/api/hall-of-fame`, { headers });
        if (hofRes.ok) {
          const data = await hofRes.json();
          if (Array.isArray(data)) {
            setHallOfFame(data);
            localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(data));
          }
        }

        // 2. Fetch Active Game State & All Guesses for current round
        const stateRes = await fetch(`${baseHttp}/api/game-state`, { headers });
        if (stateRes.ok) {
          const gameState = await stateRes.json();
          if (gameState.roundId) {
            setRoundId(gameState.roundId);
            localStorage.setItem('kkomantle_round_id', gameState.roundId);
          }
          if (Array.isArray(gameState.allGuesses)) {
            saveAllGuesses(() => gameState.allGuesses, gameState.roundId);
          }
        }
      } catch {
        // Fallback to local storage (already loaded in useState initializers)
      }
    };

    fetchServerState();
  }, [serverHost, saveAllGuesses]);

  // WebSocket connection management
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || serverHost.includes('ngrok') || serverHost.includes('trycloudflare');
    const wsUrl = `${isSecure ? 'wss://' : 'ws://'}${serverHost}/ws`;

    let ws: WebSocket;
    let retryTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
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
  }, [serverHost]);

  // Process incoming WS data
  const handleIncomingMessage = (data: any) => {
    switch (data.type) {
      case 'init':
      case 'sync_state': {
        setRoundId(data.roundId);
        localStorage.setItem('kkomantle_round_id', data.roundId);
        setActiveUsers(data.activeUsers || []);
        setVoteState(data.voteState || { activeUsers: 1, votes: 0, requiredVotes: 2, hasVoted: false });
        if (data.hallOfFame) {
          setHallOfFame(data.hallOfFame);
          localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(data.hallOfFame));
        }
        if (data.chatHistory) {
          setChatMessages(data.chatHistory);
          try { localStorage.setItem('kkomantle_chat_messages', JSON.stringify(data.chatHistory)); } catch {}
        }
        if (data.totalWords) {
          setGameStats({
            totalWords: data.totalWords,
            top1000Cutoff: data.rankCutoffs?.top1000 ?? 24.0,
            top100Cutoff: data.rankCutoffs?.top100 ?? 45.0,
            top10Cutoff: data.rankCutoffs?.top10 ?? 58.0,
          });
        }
        if (Array.isArray(data.allGuesses)) {
          saveAllGuesses(() => data.allGuesses, data.roundId);
        }
        break;
      }

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
        saveAllGuesses(prev => {
          if (prev.some(g => g.id === item.id || (g.word === item.word && g.nickname === item.nickname))) {
            return prev;
          }
          return [item, ...prev];
        });
        if (item.nickname === nickname) {
          saveMyGuesses(prev => [item, ...prev.filter(g => g.word !== item.word)].sort((a,b) => b.similarity - a.similarity));
        }
        break;
      }

      case 'win_event': {
        const isSelf = data.winnerNickname === nickname;
        setLastWinAlert({ winner: data.winnerNickname, isSelf });

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
          sound.playSimilarityTone(90);
        }
        break;
      }

      case 'round_reset': {
        setRoundId(data.roundId);
        localStorage.setItem('kkomantle_round_id', data.roundId);
        setMyGuesses([]);
        setAllGuesses([]);
        try {
          localStorage.removeItem(`kkomantle_all_guesses_${data.roundId}`);
          localStorage.removeItem(`kkomantle_my_guesses_${data.roundId}`);
        } catch {}
        setIsAnswerRevealed(false);
        setRevealedWord('');
        setVoteState(prev => ({ ...prev, votes: 0, hasVoted: false }));
        if (data.previousAnswer) {
          setPreviousRoundAnswer(data.previousAnswer);
        }
        break;
      }

      case 'chat_message':
        setChatMessages(prev => {
          const updated = [...prev, data.message].slice(-300);
          try { localStorage.setItem('kkomantle_chat_messages', JSON.stringify(updated)); } catch {}
          return updated;
        });
        break;

      case 'hall_of_fame_update':
        setHallOfFame(data.hallOfFame);
        localStorage.setItem('kkomantle_real_hall_of_fame', JSON.stringify(data.hallOfFame));
        break;

      case 'vote_update':
        setVoteState(data.voteState);
        break;

      case 'guess_error':
        setGuessError(data.message || '사전에 없는 단어입니다.');
        setTimeout(() => setGuessError(null), 3000);
        break;

      default:
        break;
    }
  };

  // Client-side fallback similarity calculation
  const calcFallbackSimilarity = (guess: string, target: string): number => {
    if (guess === target) return 100.0;
    const s1 = new Set(guess);
    const s2 = new Set(target);
    let intersection = 0;
    s1.forEach(c => { if (s2.has(c)) intersection++; });
    const union = new Set([...s1, ...s2]).size;
    const charSim = (intersection / (union || 1)) * 40;

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
    let cleanWord = trimmed.replace(/[^가-힣a-zA-Z0-9]/g, '');
    let notice: string | undefined = undefined;
    const particles = ['으로', '에서', '에게', '한테', '부터', '까지', '보다', '처럼', '만큼', '은', '는', '이', '가', '을', '를', '에', '와', '과', '도', '로', '만'];
    for (const p of particles) {
      if (cleanWord.length > p.length + 1 && cleanWord.endsWith(p)) {
        const stripped = cleanWord.slice(0, -p.length);
        notice = `${trimmed} ➔ ${stripped}`;
        cleanWord = stripped;
        break;
      }
    }

    const target = secretWordRef.current;
    const isAnswer = (cleanWord === target);
    const similarity = isAnswer ? 100.0 : calcFallbackSimilarity(cleanWord, target);

    const guessItem: GuessItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: 'local-me',
      nickname,
      word: cleanWord,
      similarity,
      timestamp: Date.now(),
      isSelf: true,
      isAnswer,
      notice,
      rank: isAnswer
        ? 1
        : similarity >= 58.0
        ? Math.max(2, Math.min(10, Math.floor(((100.0 - similarity) / 4.2) * 8) + 2))
        : similarity >= 45.0
        ? 11 + Math.floor(((58.0 - similarity) / 13.0) * 89)
        : similarity >= 35.0
        ? 101 + Math.floor(((45.0 - similarity) / 10.0) * 199)
        : similarity >= 24.0
        ? 301 + Math.floor(((35.0 - similarity) / 11.0) * 699)
        : undefined
    };

    saveMyGuesses(prev => [guessItem, ...prev.filter(g => g.word !== trimmed)].sort((a,b) => b.similarity - a.similarity));
    saveAllGuesses(prev => [guessItem, ...prev]);

    // Broadcast across tabs so other tabs see it immediately!
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SYNC_NEW_GUESS',
        guess: guessItem,
        roundId
      });
    }

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
    const prevTarget = secretWordRef.current;
    const nextIdx = (FALLBACK_SECRET_WORDS.indexOf(prevTarget) + 1) % FALLBACK_SECRET_WORDS.length;
    const newWord = FALLBACK_SECRET_WORDS[nextIdx];
    const newRoundId = `round-${Date.now()}`;

    secretWordRef.current = newWord;
    localStorage.setItem('kkomantle_secret_word', newWord);
    setRoundId(newRoundId);
    localStorage.setItem('kkomantle_round_id', newRoundId);

    setMyGuesses([]);
    setAllGuesses([]);
    try {
      localStorage.removeItem(`kkomantle_all_guesses_${newRoundId}`);
      localStorage.removeItem(`kkomantle_my_guesses_${newRoundId}`);
    } catch {}

    setIsAnswerRevealed(false);
    setRevealedWord('');
    setVoteState(prev => ({ ...prev, votes: 0, hasVoted: false }));
    setPreviousRoundAnswer(prevTarget);

    const resetMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      type: 'notice',
      sender: '시스템',
      text: `🔄 라운드 종료! 이전 정답은 [${prevTarget}] 였습니다. 새로운 단어로 시작합니다!`,
      timestamp: Date.now()
    };

    setChatMessages(prev => {
      const updated = [...prev, resetMsg].slice(-300);
      try { localStorage.setItem('kkomantle_chat_messages', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Broadcast reset to other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SYNC_ROUND_RESET',
        roundId: newRoundId,
        previousAnswer: prevTarget,
        newSecretWord: newWord
      });
      channelRef.current.postMessage({
        type: 'SYNC_CHAT',
        message: resetMsg
      });
    }
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
    if (type === 'answer_reveal') {
      const prevTarget = secretWordRef.current;
      const nextIdx = (FALLBACK_SECRET_WORDS.indexOf(prevTarget) + 1) % FALLBACK_SECRET_WORDS.length;
      const newWord = FALLBACK_SECRET_WORDS[nextIdx];
      const newRoundId = `round-${Date.now()}`;

      secretWordRef.current = newWord;
      localStorage.setItem('kkomantle_secret_word', newWord);
      setRoundId(newRoundId);
      localStorage.setItem('kkomantle_round_id', newRoundId);

      setMyGuesses([]);
      setAllGuesses([]);
      try {
        localStorage.removeItem(`kkomantle_all_guesses_${newRoundId}`);
        localStorage.removeItem(`kkomantle_my_guesses_${newRoundId}`);
      } catch {}

      setIsAnswerRevealed(false);
      setRevealedWord('');
      setPreviousRoundAnswer(prevTarget);

      const revealMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        type: 'notice',
        sender: '시스템',
        text: `📢 ${nickname}님의 요청으로 정답이 공개되었습니다: [${prevTarget}] (새 단어로 교체됩니다)`,
        timestamp: Date.now()
      };

      setChatMessages(prev => {
        const updated = [...prev, revealMsg].slice(-300);
        try { localStorage.setItem('kkomantle_chat_messages', JSON.stringify(updated)); } catch {}
        return updated;
      });

      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'SYNC_ROUND_RESET',
          roundId: newRoundId,
          previousAnswer: prevTarget,
          newSecretWord: newWord
        });
        channelRef.current.postMessage({
          type: 'SYNC_CHAT',
          message: revealMsg
        });
      }
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      sender: nickname,
      text: trimmed,
      timestamp: Date.now(),
      isSelf: true,
    };

    setChatMessages(prev => {
      const next = [...prev.slice(-299), newMsg];
      try { localStorage.setItem('kkomantle_chat_messages', JSON.stringify(next)); } catch {}
      return next;
    });

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SYNC_CHAT',
        message: newMsg
      });
    }
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
  };
};
