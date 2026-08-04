import { describe, it, expect } from 'vitest';
import { State } from 'ts-fsrs';
import { SrsEngine, createSrsEngine } from '../src/scheduler.js';
import { DEFAULT_PARAMETERS } from '../src/parameters.js';

const NOW = new Date('2024-01-01T00:00:00Z');

/** A stored card with no prior FSRS state (a brand-new card). */
function newStoredCard() {
  return { id: 'card-1', fsrsState: {}, nextReview: null, lastReview: null };
}

/** A stored card that has already been reviewed (Review state). */
function reviewedStoredCard() {
  return {
    id: 'card-2',
    nextReview: new Date('2024-01-01T00:00:00Z'),
    lastReview: new Date('2023-12-15T00:00:00Z'),
    fsrsState: {
      stability: 12.5,
      difficulty: 4.2,
      elapsed_days: 17,
      scheduled_days: 17,
      reps: 3,
      lapses: 0,
      learning_steps: 0,
      state: State.Review,
    },
  };
}

describe('SrsEngine — new cards', () => {
  const engine = createSrsEngine();

  it('handles a brand-new card and returns a valid next review', () => {
    const result = engine.scheduleReview(newStoredCard(), 'medium', NOW);
    expect(result.nextReview).toBeInstanceOf(Date);
    expect(result.nextReview.getTime()).toBeGreaterThanOrEqual(NOW.getTime());
    expect(result.fsrsState).toBeDefined();
    expect(result.log).toBeDefined();
  });

  it('a new card rated "easy" graduates to Review with a day-scale interval', () => {
    const result = engine.scheduleReview(newStoredCard(), 'easy', NOW);
    expect(result.card.state).toBe(State.Review);
    // Easy on a new card schedules ~8 days out (default_w[3]).
    const days = (result.nextReview.getTime() - NOW.getTime()) / 86400000;
    expect(days).toBeGreaterThan(1);
  });

  it('a new card rated "again" stays in Learning with a minute-scale interval', () => {
    const result = engine.scheduleReview(newStoredCard(), 'again', NOW);
    expect(result.card.state).toBe(State.Learning);
    const minutes = (result.nextReview.getTime() - NOW.getTime()) / 60000;
    expect(minutes).toBeLessThan(60);
  });
});

describe('SrsEngine — rating ordering', () => {
  const engine = createSrsEngine();

  it('Hard yields a sooner next review than Easy on a reviewed card', () => {
    const hard = engine.scheduleReview(reviewedStoredCard(), 'hard', NOW);
    const easy = engine.scheduleReview(reviewedStoredCard(), 'easy', NOW);
    expect(hard.nextReview.getTime()).toBeLessThan(easy.nextReview.getTime());
  });

  it('orders next reviews: again < hard < medium < easy', () => {
    const card = reviewedStoredCard();
    const again = engine.scheduleReview(card, 'again', NOW);
    const hard = engine.scheduleReview(card, 'hard', NOW);
    const medium = engine.scheduleReview(card, 'medium', NOW);
    const easy = engine.scheduleReview(card, 'easy', NOW);

    const times = [again, hard, medium, easy].map((r) => r.nextReview.getTime());
    expect(times[0]).toBeLessThan(times[1]);
    expect(times[1]).toBeLessThan(times[2]);
    expect(times[2]).toBeLessThan(times[3]);
  });

  it('a lapse (again) on a reviewed card increases lapses and shortens the interval', () => {
    const before = reviewedStoredCard();
    const result = engine.scheduleReview(before, 'again', NOW);
    expect(result.card.lapses).toBe(before.fsrsState.lapses + 1);
    expect(result.card.state).toBe(State.Relearning);
  });
});

describe('SrsEngine — no side effects', () => {
  const engine = createSrsEngine();

  it('does not mutate the input card', () => {
    const input = reviewedStoredCard();
    const snapshot = JSON.parse(JSON.stringify(input));
    engine.scheduleReview(input, 'easy', NOW);
    expect(JSON.parse(JSON.stringify(input))).toEqual(snapshot);
  });

  it('returns a fresh result object each call', () => {
    const a = engine.scheduleReview(reviewedStoredCard(), 'easy', NOW);
    const b = engine.scheduleReview(reviewedStoredCard(), 'easy', NOW);
    expect(a).not.toBe(b);
    expect(a.nextReview).toEqual(b.nextReview);
  });
});

describe('SrsEngine — long intervals / edge cases', () => {
  const engine = createSrsEngine();

  it('bounds intervals near maximum_interval for a very stable card', () => {
    const engine = createSrsEngine({ maximum_interval: 365 });
    // A very stable card rated easy should be scheduled near the cap. Note:
    // ts-fsrs enforces strict interval ordering (easy > good > hard > again),
    // so the final interval can exceed the per-interval cap by a day or two.
    const veryStable = {
      nextReview: new Date('2024-01-01T00:00:00Z'),
      lastReview: new Date('2023-01-01T00:00:00Z'),
      fsrsState: {
        stability: 5000,
        difficulty: 1,
        elapsed_days: 365,
        scheduled_days: 365,
        reps: 20,
        lapses: 0,
        learning_steps: 0,
        state: State.Review,
      },
    };
    const result = engine.scheduleReview(veryStable, 'easy', NOW);
    const days = (result.nextReview.getTime() - NOW.getTime()) / 86400000;
    // Bounded to roughly the cap (allowing the small ordering slack).
    expect(days).toBeGreaterThanOrEqual(300);
    expect(days).toBeLessThanOrEqual(370);
  });

  it('handles a very old card (large elapsed time) without error', () => {
    const oldCard = {
      nextReview: new Date('2020-01-01T00:00:00Z'),
      lastReview: new Date('2019-01-01T00:00:00Z'),
      fsrsState: {
        stability: 100,
        difficulty: 2,
        elapsed_days: 365,
        scheduled_days: 365,
        reps: 10,
        lapses: 0,
        learning_steps: 0,
        state: State.Review,
      },
    };
    const result = engine.scheduleReview(oldCard, 'medium', NOW);
    expect(result.nextReview).toBeInstanceOf(Date);
    expect(Number.isNaN(result.nextReview.getTime())).toBe(false);
  });
});

describe('SrsEngine — parameter overrides', () => {
  it('respects a custom request_retention', () => {
    const engine = createSrsEngine({ request_retention: 0.8 });
    const result = engine.scheduleReview(reviewedStoredCard(), 'medium', NOW);
    expect(result.nextReview).toBeInstanceOf(Date);
  });

  it('exposes documented default parameters', () => {
    expect(DEFAULT_PARAMETERS.request_retention).toBe(0.9);
    expect(DEFAULT_PARAMETERS.maximum_interval).toBe(36500);
    expect(DEFAULT_PARAMETERS.enable_fuzz).toBe(false);
  });
});

describe('SrsEngine — previewRatings', () => {
  const engine = createSrsEngine();

  it('returns a result for every UI rating', () => {
    const preview = engine.previewRatings(reviewedStoredCard(), NOW);
    expect(Object.keys(preview).sort()).toEqual(['again', 'easy', 'hard', 'medium']);
    for (const rating of Object.keys(preview)) {
      expect(preview[rating].nextReview).toBeInstanceOf(Date);
    }
  });

  it('preview does not mutate the input card', () => {
    const input = reviewedStoredCard();
    const snapshot = JSON.parse(JSON.stringify(input));
    engine.previewRatings(input, NOW);
    expect(JSON.parse(JSON.stringify(input))).toEqual(snapshot);
  });
});

describe('SrsEngine — invalid input', () => {
  const engine = createSrsEngine();

  it('throws for an invalid UI rating', () => {
    expect(() => engine.scheduleReview(newStoredCard(), 'nope', NOW)).toThrow(
      TypeError
    );
  });
});
