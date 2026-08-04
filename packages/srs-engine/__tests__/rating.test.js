import { describe, it, expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import { mapUiRatingToFsrs, UI_RATINGS } from '../src/rating.js';

describe('mapUiRatingToFsrs', () => {
  it('maps each UI rating to the correct FSRS grade (1-4)', () => {
    expect(mapUiRatingToFsrs('again')).toBe(Rating.Again); // 1
    expect(mapUiRatingToFsrs('hard')).toBe(Rating.Hard); // 2
    expect(mapUiRatingToFsrs('medium')).toBe(Rating.Good); // 3
    expect(mapUiRatingToFsrs('easy')).toBe(Rating.Easy); // 4
  });

  it('maps "medium" to FSRS "Good" (3)', () => {
    expect(mapUiRatingToFsrs('medium')).toBe(3);
  });

  it('exposes the full set of supported UI ratings', () => {
    expect(UI_RATINGS).toEqual(['again', 'hard', 'medium', 'easy']);
  });

  it('throws for an unknown rating', () => {
    expect(() => mapUiRatingToFsrs('super-easy')).toThrow(TypeError);
    expect(() => mapUiRatingToFsrs('')).toThrow(TypeError);
    expect(() => mapUiRatingToFsrs(undefined)).toThrow(TypeError);
  });

  it('is case-sensitive and rejects uppercase input', () => {
    expect(() => mapUiRatingToFsrs('Easy')).toThrow(TypeError);
  });
});
