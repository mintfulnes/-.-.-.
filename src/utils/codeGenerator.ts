import { ArtworkId } from '../types';
import { ARTWORK_IDS } from '../data/artworks';

// Alphabet without O, I to prevent confusion with 0, 1, and digits 2-9
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateParticipantCode(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[randomIndex];
  }
  return result;
}

export function assignGroup(): 'A' | 'B' {
  return Math.random() < 0.5 ? 'A' : 'B';
}

export function shuffleArtworkOrder(): ArtworkId[] {
  const list = [...ARTWORK_IDS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
