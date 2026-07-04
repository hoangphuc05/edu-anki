// Extend Vitest's expect with jest-dom matchers
// (e.g. toBeInTheDocument, toHaveTextContent, toBeVisible, etc.)
import '@testing-library/jest-dom';

// Make React available globally so JSX works without explicit imports in each file.
// This is needed because the Vitest jsdom environment uses a classic JSX transform.
import * as React from 'react';
(globalThis as typeof globalThis & { React: typeof React }).React = React;

