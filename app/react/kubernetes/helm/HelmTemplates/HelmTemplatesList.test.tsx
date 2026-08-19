import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';

import { Chart } from '../types';

import { HelmTemplatesList } from './HelmTemplatesList';

// Sample test data
const mockCharts: Chart[] = [
  {
    name: 'test-chart-1',
    description: 'Test Chart 1 Description',
    repo: 'https://example.com',
    annotations: {
      category: 'database',
    },
    version: '1.0.0',
    versions: ['1.0.0', '1.0.1'],
  },
  {
    name: 'test-chart-2',
    description: 'Test Chart 2 Description',
    repo: 'https://example.com',
    annotations: {
      category: 'database',
    },
    version: '1.0.0',
    versions: ['1.0.0', '1.0.1'],
  },
  {
    name: 'nginx-chart',
    description: 'Nginx Web Server',
    repo: 'https://example.com/2',
    annotations: {
      category: 'web',
    },
    version: '1.0.0',
    versions: ['1.0.0', '1.0.1'],
  },
];

const selectActionMock = vi.fn();

const mockUseEnvironmentId = vi.fn(() => 1);

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

// Mock the helm registries query
vi.mock('../queries/useHelmRegistries', () => ({
  useHelmRegistries: vi.fn(() => ({
    data: ['https://example.com', 'https://example.com/2'],
    isInitialLoading: false,
    isError: false,
  })),
}));

// Mock the environment registries query
vi.mock(
  '@/react/portainer/environments/queries/useEnvironmentRegistries',
  () => ({
    useEnvironmentRegistries: vi.fn(() => ({
      data: [
        { Id: 1, URL: 'https://registry.example.com' },
        { Id: 2, URL: 'https://registry2.example.com' },
      ],
      isInitialLoading: false,
      isError: false,
    })),
  })
);

function renderComponent({
  loading = false,
  charts = mockCharts,
  selectAction = selectActionMock,
  selectedRegistry = {
    repoUrl: 'https://example.com',
    name: 'Test Registry',
  },
}: {
  loading?: boolean;
  charts?: Chart[];
  selectAction?: (chart: Chart) => void;
  selectedRegistry?: {
    repoUrl?: string;
    name?: string;
  } | null;
} = {}) {
  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <HelmTemplatesList
          isLoadingCharts={loading}
          charts={charts}
          selectAction={selectAction}
          selectedRegistry={selectedRegistry}
        />
      )),
      user
    )
  );
  return { ...render(<Wrapped />), user };
}

describe('HelmTemplatesList', () => {
  beforeEach(() => {
    selectActionMock.mockClear();
  });

  it('should display title and charts list', async () => {
    renderComponent();

    // Check for the title with registry name
    expect(
      screen.getByText('Select a helm chart from Test Registry')
    ).toBeInTheDocument();

    // Check for charts
    expect(screen.getByText('test-chart-1')).toBeInTheDocument();
    expect(screen.getByText('Test Chart 1 Description')).toBeInTheDocument();
    expect(screen.getByText('nginx-chart')).toBeInTheDocument();
    expect(screen.getByText('Nginx Web Server')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/2')).toBeInTheDocument();
  });

  it('should call selectAction when a chart is clicked', async () => {
    renderComponent();

    // Find the first chart item
    const firstChartItem = screen.getByText('test-chart-1').closest('button');
    expect(firstChartItem).not.toBeNull();

    // Click on the chart item
    if (firstChartItem) {
      fireEvent.click(firstChartItem);
    }

    // Check if selectAction was called with the correct chart
    expect(selectActionMock).toHaveBeenCalledWith(mockCharts[0]);
  });

  it('should filter charts by text search', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Find search input and type "nginx"
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'nginx');

    // Wait 300ms for debounce
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, 300);
    });

    // Should show only nginx chart
    expect(screen.getByText('nginx-chart')).toBeInTheDocument();
    expect(screen.queryByText('test-chart-1')).not.toBeInTheDocument();
    expect(screen.queryByText('test-chart-2')).not.toBeInTheDocument();
  });

  it('should filter charts by category', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Find the category select
    const categorySelect = screen.getByText('Select a category');
    await user.click(categorySelect);

    // Select "web" category
    const webCategory = screen.getByText('web', {
      selector: '[tabindex="-1"]',
    });
    await user.click(webCategory);

    // Should show only web category charts
    expect(screen.queryByText('nginx-chart')).toBeInTheDocument();
    expect(screen.queryByText('test-chart-1')).not.toBeInTheDocument();
    expect(screen.queryByText('test-chart-2')).not.toBeInTheDocument();
  });

  it('should show loading message when loading prop is true', async () => {
    renderComponent({ loading: true, charts: [] });

    // Check for loading message
    expect(screen.getByText('Loading helm charts...')).toBeInTheDocument();
    expect(
      screen.getByText('Initial download of Helm charts can take a few minutes')
    ).toBeInTheDocument();
  });

  it('should show empty message when no charts are available and a registry is selected', async () => {
    renderComponent({
      charts: [],
      selectedRegistry: {
        repoUrl: 'https://example.com',
        name: 'Test Registry',
      },
    });

    // Check for empty message
    expect(
      screen.getByText('No helm charts available in this repository.')
    ).toBeInTheDocument();
  });

  it("should show 'select registry' message when no charts are available and no registry is selected", async () => {
    renderComponent({ charts: [], selectedRegistry: null });

    // Check for message
    expect(
      screen.getByText(
        'Please select a repository to view available Helm charts.'
      )
    ).toBeInTheDocument();
  });

  it('should show no results message when search has no matches', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Find search input and type text that won't match any charts
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'nonexistent chart');

    // Wait 300ms for debounce
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, 300);
    });

    // Check for no results message
    expect(screen.getByText('No Helm charts found')).toBeInTheDocument();
  });

  it('should handle keyboard navigation and selection', async () => {
    renderComponent();
    const user = userEvent.setup();

    // Find the first chart item
    const firstChartItem = screen.getByText('test-chart-1').closest('button');
    expect(firstChartItem).not.toBeNull();

    // Focus and press Enter
    if (firstChartItem) {
      (firstChartItem as HTMLElement).focus();
      await user.keyboard('{Enter}');
    }

    // Check if selectAction was called with the correct chart
    expect(selectActionMock).toHaveBeenCalledWith(mockCharts[0]);
  });
});
