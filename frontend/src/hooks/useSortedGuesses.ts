import { useMemo } from 'react';
import { GuessItem } from '../types/game';

export type SortMode = 'similarity' | 'recent';

export function useSortedGuesses(guesses: GuessItem[], sortMode: SortMode): GuessItem[] {
  return useMemo(() => {
    const list = [...guesses];
    if (sortMode === 'similarity') {
      return list.sort((a, b) => {
        if (a.isAnswer) return -1;
        if (b.isAnswer) return 1;
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return b.similarity - a.similarity;
      });
    }
    // 'recent' mode: descending timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [guesses, sortMode]);
}
