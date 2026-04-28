import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { EnvironmentHeader } from './EnvironmentHeader';

const mockCounts = {
  total: 10,
  up: 7,
  down: 2,
  unassigned: 1,
};

function renderComponent(
  props: Partial<React.ComponentProps<typeof EnvironmentHeader>> = {}
) {
  const defaultProps: React.ComponentProps<typeof EnvironmentHeader> = {
    activeFilter: 'all',
    onFilterChange: vi.fn(),
    ...props,
  };

  const Wrapped = withTestQueryProvider(EnvironmentHeader);
  return { ...render(<Wrapped {...defaultProps} />), props: defaultProps };
}

function mockSummaryCounts(counts = mockCounts) {
  server.use(
    http.get('/api/endpoints/summary', () => HttpResponse.json(counts))
  );
}

describe('EnvironmentHeader', () => {
  it('should render counts and toggle filter on click', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    mockSummaryCounts();

    renderComponent({ onFilterChange });

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /filter by up/i })
      ).toBeVisible();
    });

    expect(
      screen.getByRole('radio', { name: /filter by total/i })
    ).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by down/i })
    ).toBeVisible();
    expect(
      screen.getByRole('radio', { name: /filter by unassigned/i })
    ).toBeVisible();

    await user.click(screen.getByRole('radio', { name: /filter by up/i }));
    expect(onFilterChange).toHaveBeenCalledWith('up');
  });

  it('should reset to all when Total is clicked while a filter is active', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    mockSummaryCounts();

    renderComponent({ activeFilter: 'up', onFilterChange });

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /filter by total/i })
      ).toBeVisible();
    });

    await user.click(screen.getByRole('radio', { name: /filter by total/i }));
    expect(onFilterChange).toHaveBeenCalledWith('all');
  });
});
