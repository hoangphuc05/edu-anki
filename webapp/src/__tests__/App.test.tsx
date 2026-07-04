import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';


describe('App component', () => {
  it('renders without crashing', () => {
    render(<App />);
  });

  it('displays "Hello world" text', () => {
    render(<App />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
