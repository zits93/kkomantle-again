export type ThemeMode = 'light' | 'dark' | 'excel';

export interface User {
  id: string;
  nickname: string;
  ipMasked?: string;
  isSelf?: boolean;
}

export interface GuessItem {
  id: string;
  userId: string;
  nickname: string;
  word: string;
  similarity: number; // 0.0 ~ 100.0
  rank?: number; // 1 ~ 1000
  pos?: string;
  timestamp: number;
  isSelf: boolean;
  isAnswer?: boolean;
  notice?: string;
}

export interface ChatMessage {
  id: string;
  type: 'chat' | 'notice' | 'system' | 'answer_reveal';
  sender: string;
  text: string;
  timestamp: number;
  isSelf?: boolean;
}

export interface HallOfFameEntry {
  rank: number;
  nickname: string;
  winCount: number;
  lastWonAt?: string;
  isSelf?: boolean;
}

export interface VoteState {
  activeUsers: number;
  votes: number;
  requiredVotes: number;
  hasVoted: boolean;
}

export interface GameStats {
  totalWords: number;
  top1000Cutoff: number;
  top100Cutoff: number;
  top10Cutoff: number;
}

export interface UserCheckResult {
  nickname: string;
  exists: boolean;
  lastMaskedIp?: string;
  currentClientIp?: string;
  isSameIp?: boolean;
  totalWins?: number;
  lastSeenAt?: string;
}

export interface GameStatus {
  roundId: string;
  targetRevealed?: boolean;
  answerWord?: string;
  totalGuesses: number;
  solvedBy?: string;
}
