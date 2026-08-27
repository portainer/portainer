import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { NodeStatsView } from './NodeStatsView';

vi.mock('@uirouter/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1, nodeName: 'my-node' },
  })),
}));

vi.mock('recharts');

const nodeMetricsSuccess = {
  metadata: { creationTimestamp: '2024-01-01T00:00:00Z' },
  usage: { cpu: '250m', memory: '512Mi' },
};

function addBaseHandlers() {
  server.use(
    http.get('/api/endpoints/1/kubernetes/api/v1/nodes/my-node', () =>
      HttpResponse.json({ status: { allocatable: { cpu: '4' } } })
    )
  );
}

beforeEach(() => {
  addBaseHandlers();
});

function renderComponent() {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(NodeStatsView))
  );
  return render(<Wrapped />);
}

describe('NodeStatsView', () => {
  it('renders the page header "Node stats"', () => {
    server.use(
      http.get('/api/kubernetes/1/metrics/nodes/my-node', () =>
        HttpResponse.json(nodeMetricsSuccess)
      )
    );

    renderComponent();

    expect(screen.getByText('Node stats')).toBeInTheDocument();
  });

  it('shows "Unable to retrieve node metrics" panel when metrics fetch returns 500', async () => {
    const restoreConsole = suppressConsoleLogs();
    server.use(
      http.get('/api/kubernetes/1/metrics/nodes/my-node', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Unable to retrieve node metrics')
      ).toBeInTheDocument();
    });

    restoreConsole();
  });

  it('shows the refresh rate select when metrics are available', async () => {
    server.use(
      http.get('/api/kubernetes/1/metrics/nodes/my-node', () =>
        HttpResponse.json(nodeMetricsSuccess)
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /refresh rate/i })
      ).toBeInTheDocument();
    });
  });

  it('does not show the unavailable panel when metrics fetch succeeds', async () => {
    server.use(
      http.get('/api/kubernetes/1/metrics/nodes/my-node', () =>
        HttpResponse.json(nodeMetricsSuccess)
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /refresh rate/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText('Unable to retrieve node metrics')
    ).not.toBeInTheDocument();
  });
});
