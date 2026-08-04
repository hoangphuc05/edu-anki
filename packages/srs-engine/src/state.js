import { createEmptyCard, State } from 'ts-fsrs';

/**
 * The subset of a stored card record that the scheduler needs to compute the
 * next review. This is intentionally a plain, serialisable shape so the
 * scheduler can be tested in isolation without a database.
 *
 * @typedef {object} StoredCardState
 * @property {string} [id] - Card id (optional, informational).
 * @property {object} [fsrsState] - Parsed FSRS memory state
 *   ({ stability, difficulty, ... }).
 * @property {Date|string|null} [nextReview] - Current due date.
 * @property {Date|string|null} [lastReview] - Date of the last review.
 */

/**
 * The result of a scheduling computation: the updated card state plus the
 * review log produced by FSRS. Pure data, no side effects.
 *
 * @typedef {object} SchedulingResult
 * @property {object} card - The updated FSRS card (ts-fsrs `Card`).
 * @property {object} log - The review log produced by FSRS.
 * @property {Date} nextReview - The next review date (card.due).
 * @property {Date|null} lastReview - The review date (card.last_review).
 * @property {object} fsrsState - The serialisable FSRS memory state to persist.
 */

/**
 * Create a fresh FSRS card for a brand-new card.
 *
 * @param {Date|string|number} [now] - The creation/review time.
 * @returns {import('ts-fsrs').Card} A new FSRS card in the `New` state.
 */
export function createNewCard(now = new Date()) {
  return createEmptyCard(now);
}

/**
 * Convert a stored card record into a ts-fsrs `Card` object.
 *
 * If the card has no persisted FSRS state (a new card), a fresh empty card is
 * returned. Otherwise the stored memory state and due/last-review dates are
 * reconstructed.
 *
 * @param {StoredCardState} stored - The stored card record.
 * @returns {import('ts-fsrs').Card} A ts-fsrs `Card` ready for scheduling.
 */
export function toFsrsCard(stored) {
  const state = stored.fsrsState || {};

  // No persisted state -> brand new card.
  if (!state.stability && !state.difficulty && !stored.nextReview) {
    return createNewCard(stored.lastReview || new Date());
  }

  return {
    due: stored.nextReview ? new Date(stored.nextReview) : new Date(),
    stability: state.stability ?? 0,
    difficulty: state.difficulty ?? 0,
    elapsed_days: state.elapsed_days ?? 0,
    scheduled_days: state.scheduled_days ?? 0,
    reps: state.reps ?? 0,
    lapses: state.lapses ?? 0,
    learning_steps: state.learning_steps ?? 0,
    state: state.state ?? State.New,
    last_review: stored.lastReview ? new Date(stored.lastReview) : undefined,
  };
}

/**
 * Extract the serialisable FSRS memory state from a ts-fsrs `Card` so it can
 * be persisted (e.g. into the `fsrsState` JSON column).
 *
 * @param {import('ts-fsrs').Card} card - The updated FSRS card.
 * @returns {object} A plain object of memory-state fields.
 */
export function extractFsrsState(card) {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learning_steps,
    state: card.state,
  };
}
