import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { EdgeEditButton } from './EdgeEditButton';

const mockUseIsEdgeAdmin = vi.fn();

vi.mock('@/react/hooks/useUser', () => ({
  useIsEdgeAdmin: () => mockUseIsEdgeAdmin(),
}));

vi.mock('@@/Tip/TooltipWithChildren', () => ({
  TooltipWithChildren: ({
    children,
    message,
  }: {
    children: React.ReactNode;
    message: string;
  }) => (
    <div data-cy="tooltip" data-message={message}>
      {children}
    </div>
  ),
}));

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <a href="/">{children}</a>
  ),
}));

describe('EdgeEditButton', () => {
  it('renders disabled button without tooltip while loading', () => {
    mockUseIsEdgeAdmin.mockReturnValue({ isLoading: true, isAdmin: false });

    render(<EdgeEditButton stackId={1} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('renders enabled button without tooltip for edge admin', () => {
    mockUseIsEdgeAdmin.mockReturnValue({ isLoading: false, isAdmin: true });

    render(<EdgeEditButton stackId={1} />);

    const button = screen.getByRole('link');
    expect(button).not.toBeDisabled();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('renders disabled button with tooltip for non-admin', () => {
    mockUseIsEdgeAdmin.mockReturnValue({ isLoading: false, isAdmin: false });

    render(<EdgeEditButton stackId={1} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveAttribute(
      'data-message',
      'This application is managed by an edge stack and can only be edited by an edge administrator'
    );
  });
});
