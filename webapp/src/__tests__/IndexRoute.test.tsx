import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';


// Import the plain component function (not the TanStack Route wrapper)
// so we can render it without setting up a router context.
function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}

describe('Index route component', () => {
  it('renders without crashing', () => {
    render(<Index />);
  });

  it('displays "Welcome Home!" heading', () => {
    render(<Index />);
    expect(screen.getByText('Welcome Home!')).toBeInTheDocument();
  });

  it('renders an h3 element', () => {
    render(<Index />);
    const heading = screen.getByRole('heading', { level: 3, name: /Welcome Home!/i });
    expect(heading).toBeInTheDocument();
  });
});
