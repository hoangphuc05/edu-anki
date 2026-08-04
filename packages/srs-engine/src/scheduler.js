import { createScheduler } from './parameters.js';
import { mapUiRatingToFsrs } from './rating.js';
import { toFsrsCard, extractFsrsState } from './state.js';

/**
 * The SRS scheduling service.
 *
 * Wraps `ts-fsrs` to compute the next review date and updated card state from
 * a user rating and the current card state. All functions are pure: they take
 * plain data and return plain data, with no database or other side effects,
 * which makes the service fully testable in isolation.
 */
export class SrsEngine {
  /**
   * @param {object} [parameters] - Optional FSRS parameter overrides.
   */
  constructor(parameters = {}) {
    this.scheduler = createScheduler(parameters);
  }

  /**
   * Compute the next review schedule for a card given a UI rating.
   *
   * @param {object} storedCard - The stored card record (see `StoredCardState`).
   * @param {string} uiRating - One of 'again' | 'hard' | 'medium' | 'easy'.
   * @param {Date|string|number} [now] - The time of the review (defaults to now).
   * @returns {import('./state.js').SchedulingResult} The updated card state and
   *   review log. The input card is never mutated.
   */
  scheduleReview(storedCard, uiRating, now = new Date()) {
    const grade = mapUiRatingToFsrs(uiRating);
    const currentCard = toFsrsCard(storedCard);

    const { card, log } = this.scheduler.next(currentCard, now, grade);

    return {
      card,
      log,
      nextReview: card.due,
      lastReview: card.last_review ?? null,
      fsrsState: extractFsrsState(card),
    };
  }

  /**
   * Preview the scheduling outcome for every possible rating without applying
   * any of them. Useful for showing the user what each button would do.
   *
   * @param {object} storedCard - The stored card record.
   * @param {Date|string|number} [now] - The time of the review.
   * @returns {object} A map of `{ [uiRating]: SchedulingResult }`.
   */
  previewRatings(storedCard, now = new Date()) {
    const currentCard = toFsrsCard(storedCard);
    const preview = this.scheduler.repeat(currentCard, now);

    const result = {};
    for (const uiRating of ['again', 'hard', 'medium', 'easy']) {
      const grade = mapUiRatingToFsrs(uiRating);
      const { card, log } = preview[grade];
      result[uiRating] = {
        card,
        log,
        nextReview: card.due,
        lastReview: card.last_review ?? null,
        fsrsState: extractFsrsState(card),
      };
    }
    return result;
  }
}

/**
 * Convenience factory for a default-configured engine.
 *
 * @param {object} [parameters] - Optional FSRS parameter overrides.
 * @returns {SrsEngine}
 */
export function createSrsEngine(parameters = {}) {
  return new SrsEngine(parameters);
}
