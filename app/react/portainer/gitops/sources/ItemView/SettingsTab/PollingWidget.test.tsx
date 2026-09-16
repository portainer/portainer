import { render, screen } from '@testing-library/react';

import { PollingWidget } from './PollingWidget';

vi.mock(
  '@/react/portainer/feature-flags/feature-flags.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/react/portainer/feature-flags/feature-flags.service')
    >()),
    isBE: false,
  })
);

describe('PollingWidget', () => {
  it('explains that the interval only applies to regular stacks when polling is enabled', () => {
    render(<PollingWidget interval="5m" />);

    expect(screen.getByText(/only applies to regular stacks/i)).toBeVisible();
  });

  it('does not show the tip when polling is disabled', () => {
    render(<PollingWidget />);

    expect(
      screen.queryByText(/only applies to regular stacks/i)
    ).not.toBeInTheDocument();
  });
});
