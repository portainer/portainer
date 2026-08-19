import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StatusSummaryBar, StatusSegment } from './StatusSummaryBar';

const defaultSegments: StatusSegment[] = [
  { key: 'up', label: 'Up', count: 7, color: 'success' },
  { key: 'down', label: 'Down', count: 2, color: 'error' },
  { key: 'outdated', label: 'Outdated', count: 1, color: 'warning' },
  { key: 'unassigned', label: 'Unassigned', count: 0, color: 'gray' },
];

function renderComponent(
  props: Partial<React.ComponentProps<typeof StatusSummaryBar>> = {}
) {
  const defaultProps: React.ComponentProps<typeof StatusSummaryBar> = {
    total: 10,
    segments: defaultSegments,
    value: null,
    onChange: vi.fn(),
    ...props,
  };

  return {
    ...render(<StatusSummaryBar {...defaultProps} />),
    props: defaultProps,
  };
}

describe('StatusSummaryBar', () => {
  it('should render total and each non-zero segment', () => {
    renderComponent();

    expect(
      screen.getByRole('radio', { name: /filter by total/i })
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: /filter by up/i })).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by down/i })
    ).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by outdated/i })
    ).toBeVisible();
    // Unassigned has count 0, FilterBarButton returns null
    expect(
      screen.queryByRole('radio', { name: /filter by unassigned/i })
    ).not.toBeInTheDocument();
  });

  it('should call onChange with segment key when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ onChange });

    await user.click(screen.getByRole('radio', { name: /filter by up/i }));
    expect(onChange).toHaveBeenCalledWith('up');
  });

  it('should toggle back to all when clicking the active segment', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: 'up', onChange });

    await user.click(screen.getByRole('radio', { name: /filter by up/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should reset to all when Total is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: 'down', onChange });

    await user.click(screen.getByRole('radio', { name: /filter by total/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should show the active filter indicator with a clear button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: 'down', onChange });

    expect(screen.getByRole('status')).toBeVisible();
    expect(
      screen.getByRole('button', { name: /clear filter/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear filter/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should not show the active filter indicator when no filter is active', () => {
    renderComponent({ value: null });

    expect(
      screen.queryByRole('button', { name: /clear filter/i })
    ).not.toBeInTheDocument();
  });

  it('should have radiogroup role with the provided aria label', () => {
    renderComponent({ ariaLabel: 'Filter environments' });

    expect(
      screen.getByRole('radiogroup', { name: 'Filter environments' })
    ).toBeVisible();
  });
});
