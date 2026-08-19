import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';

import { Chart } from '../types';

import { HelmTemplatesSelectedItem } from './HelmTemplatesSelectedItem';

// Sample test data
const mockChart: Chart = {
  name: 'test-chart',
  description: 'Test Chart Description',
  repo: 'https://example.com',
  icon: 'test-icon-url',
  annotations: {
    category: 'database',
  },
  version: '1.0.1',
  versions: ['1.0.0', '1.0.1'],
};

const clearHelmChartMock = vi.fn();
const mockRouterStateService = {
  go: vi.fn(),
};

function renderComponent({ selectedChart = mockChart, isAdmin = true } = {}) {
  const user = new UserViewModel({ Username: 'user', Role: isAdmin ? 1 : 2 });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <HelmTemplatesSelectedItem
          selectedChart={selectedChart}
          clearHelmChart={clearHelmChartMock}
        />
      )),
      user
    )
  );

  return {
    ...render(<Wrapped />),
    user,
    mockRouterStateService,
  };
}

describe('HelmTemplatesSelectedItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display selected chart information', () => {
    renderComponent();

    // Check for chart details
    expect(screen.getByText('test-chart')).toBeInTheDocument();
    expect(screen.getByText('Test Chart Description')).toBeInTheDocument();
    expect(screen.getByText('Clear selection')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
});
