import { Rating } from 'ts-fsrs';

/**
 * The UI-facing review ratings supported by the scheduler.
 *
 * These are intentionally decoupled from the raw FSRS `Rating` enum so the
 * UI can present a simple, user-friendly set of choices while the service
 * layer owns the mapping to the FSRS scale (1-4).
 *
 * @see https://open-spaced-repetition.github.io/ts-fsrs/enums/Rating.html
 */
export const UI_RATINGS = Object.freeze(['again', 'hard', 'medium', 'easy']);

/**
 * Maps each UI rating to its FSRS `Rating` grade.
 *
 * FSRS scale (1-4):
 *   - Again = 1
 *   - Hard  = 2
 *   - Good  = 3
 *   - Easy  = 4
 *
 * The UI "Medium" rating corresponds to FSRS "Good" (3).
 */
const UI_TO_FSRS = Object.freeze({
  again: Rating.Again, // 1
  hard: Rating.Hard, // 2
  medium: Rating.Good, // 3
  easy: Rating.Easy, // 4
});

/**
 * Map a UI rating string to its FSRS grade (1-4).
 *
 * @param {string} uiRating - One of `UI_RATINGS` ('again' | 'hard' | 'medium' | 'easy').
 * @returns {number} The FSRS `Rating` grade (1-4).
 * @throws {TypeError} If `uiRating` is not a known UI rating.
 */
export function mapUiRatingToFsrs(uiRating) {
  const grade = UI_TO_FSRS[uiRating];
  if (grade === undefined) {
    throw new TypeError(
      `Invalid UI rating: ${uiRating}. Expected one of ${UI_RATINGS.join(', ')}`
    );
  }
  return grade;
}
