import { describe, it, expect } from 'vitest';
import { State } from 'ts-fsrs';
import {
  createNewCard,
  toFsrsCard,
  extractFsrsState,
} from '../src/state.js';

describe('createNewCard', () => {
  it('creates a card in the New state with zeroed memory', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const card = createNewCard(now);
    expect(card.state).toBe(State.New);
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.due).toEqual(now);
  });
});

describe('toFsrsCard', () => {
  it('returns a new card when there is no persisted state', () => {
    const card = toFsrsCard({});
    expect(card.state).toBe(State.New);
    expect(card.stability).toBe(0);
  });

  it('reconstructs a reviewed card from stored state and dates', () => {
    const nextReview = new Date('2024-02-01T00:00:00Z');
    const lastReview = new Date('2024-01-15T00:00:00Z');
    const card = toFsrsCard({
      nextReview,
      lastReview,
      fsrsState: {
        stability: 12.5,
        difficulty: 4.2,
        elapsed_days: 17,
        scheduled_days: 17,
        reps: 3,
        lapses: 1,
        learning_steps: 0,
        state: State.Review,
      },
    });
    expect(card.state).toBe(State.Review);
    expect(card.stability).toBe(12.5);
    expect(card.difficulty).toBe(4.2);
    expect(card.reps).toBe(3);
    expect(card.lapses).toBe(1);
    expect(card.due).toEqual(nextReview);
    expect(card.last_review).toEqual(lastReview);
  });

  it('handles string dates', () => {
    const card = toFsrsCard({
      nextReview: '2024-02-01T00:00:00Z',
      lastReview: '2024-01-15T00:00:00Z',
      fsrsState: { stability: 5, difficulty: 3, state: State.Review },
    });
    expect(card.due).toEqual(new Date('2024-02-01T00:00:00Z'));
    expect(card.last_review).toEqual(new Date('2024-01-15T00:00:00Z'));
  });
});

describe('extractFsrsState', () => {
  it('extracts a serialisable memory-state object', () => {
    const card = {
      stability: 1,
      difficulty: 2,
      elapsed_days: 3,
      scheduled_days: 4,
      reps: 5,
      lapses: 6,
      learning_steps: 7,
      state: State.Review,
    };
    expect(extractFsrsState(card)).toEqual({
      stability: 1,
      difficulty: 2,
      elapsed_days: 3,
      scheduled_days: 4,
      reps: 5,
      lapses: 6,
      learning_steps: 7,
      state: State.Review,
    });
  });
});
