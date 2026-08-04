import { fsrs } from 'ts-fsrs';

/**
 * Default FSRS parameters used by the scheduler.
 *
 * These mirror the `ts-fsrs` defaults so behaviour is predictable and
 * documented. They can be overridden per-call (e.g. from user settings) via
 * `createScheduler(overrides)`.
 *
 * @see https://open-spaced-repetition.github.io/ts-fsrs/interfaces/FSRSParameters.html
 */
export const DEFAULT_PARAMETERS = Object.freeze({
  // Target probability of recall the scheduler tries to maintain (0-1).
  request_retention: 0.9,
  // Upper bound (in days) on how far into the future a card can be scheduled.
  maximum_interval: 36500,
  // Adds a small random delay to long intervals to avoid card "clumping".
  enable_fuzz: false,
  // When true, (re)learning steps are applied for short-term scheduling.
  enable_short_term: true,
  // Short-term learning steps for new cards.
  learning_steps: ['1m', '10m'],
  // Short-term relearning steps after a lapse.
  relearning_steps: ['10m'],
});

/**
 * Create a configured FSRS scheduler instance.
 *
 * @param {object} [overrides] - Partial FSRS parameters to override the defaults.
 * @returns {import('ts-fsrs').FSRS} A configured FSRS scheduler.
 */
export function createScheduler(overrides = {}) {
  return fsrs({ ...DEFAULT_PARAMETERS, ...overrides });
}
