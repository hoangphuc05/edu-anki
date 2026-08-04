# srs-engine

A service layer that wraps [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs)
to calculate review schedules from user ratings and the current card state.

The logic is isolated into pure functions so it can be tested in isolation and
the FSRS parameters can be tuned later (e.g. from user settings) without
touching the rest of the application.

## Rating mapping

The UI exposes four ratings, which are mapped to the FSRS scale (1-4):

| UI rating | FSRS rating | FSRS value |
| --------- | ----------- | ---------- |
| `again`   | `Again`     | 1          |
| `hard`    | `Hard`      | 2          |
| `medium`  | `Good`      | 3          |
| `easy`    | `Easy`      | 4          |

See the [ts-fsrs Rating enum](https://open-spaced-repetition.github.io/ts-fsrs/enums/Rating.html).

## Usage

```js
import { createSrsEngine } from 'srs-engine';

const engine = createSrsEngine();

// A stored card record (plain data, no DB required).
const storedCard = {
  id: 'card-1',
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
    state: 2, // State.Review
  },
};

const result = engine.scheduleReview(storedCard, 'medium', new Date());

console.log(result.nextReview); // Date of the next review
console.log(result.fsrsState); // Updated memory state to persist
console.log(result.log); // FSRS review log
```

For a brand-new card, pass an empty state:

```js
const result = engine.scheduleReview({ fsrsState: {} }, 'easy', new Date());
```

To preview what every rating would do without applying any of them:

```js
const preview = engine.previewRatings(storedCard, new Date());
console.log(preview.hard.nextReview);
```

## API

- `createSrsEngine(parameters?)` / `new SrsEngine(parameters?)` — create an engine.
- `engine.scheduleReview(storedCard, uiRating, now?)` — compute the next schedule.
- `engine.previewRatings(storedCard, now?)` — preview all four outcomes.
- `mapUiRatingToFsrs(uiRating)` — map a UI rating to an FSRS grade (1-4).
- `createNewCard(now?)`, `toFsrsCard(stored)`, `extractFsrsState(card)` — state helpers.
- `DEFAULT_PARAMETERS` — the default FSRS parameters.

All functions are pure: they never mutate their inputs and never touch a
database, so they are fully testable in isolation.

## Default parameters

These mirror the `ts-fsrs` defaults and can be overridden per-engine:

| Parameter            | Default  | Description                                                        |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `request_retention`  | `0.9`    | Target probability of recall (0-1). Higher = more reviews.         |
| `maximum_interval`   | `36500`  | Upper bound (days) on how far ahead a card can be scheduled.       |
| `enable_fuzz`        | `false`  | Adds small random delay to long intervals.                         |
| `enable_short_term`  | `true`   | Applies (re)learning steps for short-term scheduling.              |
| `learning_steps`     | `['1m','10m']` | Short-term learning steps for new cards.                     |
| `relearning_steps`   | `['10m']` | Short-term relearning steps after a lapse.                         |

```js
const engine = createSrsEngine({ request_retention: 0.8, maximum_interval: 365 });
```

## Testing

```sh
pnpm test
```

The test suite covers rating mapping, new-card initialization, all rating
combinations, interval ordering (Hard sooner than Easy), long-interval edge
cases, parameter overrides, and confirms the service has no side effects.
