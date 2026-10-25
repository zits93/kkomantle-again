import { useMemo } from 'react';
import { GuessItem } from '../types/game';

export type SortMode = 'similarity' | 'recent';

export function useSortedGuesses(guesses: GuessItem[], sortMode: SortMode): GuessItem[] {
  return useMemo(() => {
    const list = [...guesses];
    if (sortMode === 'similarity') {
      return list.sort((a, b) => {
        if (a.isAnswer && !b.isAnswer) return -1;
        if (!a.isAnswer && b.isAnswer) return 1;
        // Primary: Strict similarity descending
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        // Secondary: Lower rank number first if both exist
        if (a.rank && b.rank && a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        if (a.rank && !b.rank) return -1;
        if (!a.rank && b.rank) return 1;
        // Tertiary: Latest timestamp
        return b.timestamp - a.timestamp;
      });
    }
    // 'recent' mode: descending timestamp
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [guesses, sortMode]);
}
