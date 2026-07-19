import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { ApplicationStatsView } from './ApplicationStatsView';

vi.mock('@uirouter/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: {
      endpointId: 1,
      namespace: 'default',
      name: 'my-app',
      pod: 'my-pod',
      container: 'my-container',
    },
  })),
}));

const podMetricsSuccess = {
  timestamp: '2024-01-01T00:00:00Z',
  containers: [
    {
      name: 'my-container',
      usage: { cpu: '100m', memory: '128Mi' },
    },
  ],
};

function addBaseHandlers() {
  server.use(
    http.get(
      '/api/endpoints/1/kubernetes/api/v1/namespaces/default/pods/my-pod',
      () => HttpResponse.json({ spec: { nodeName: 'node1' } })
    ),
    http.get('/api/endpoints/1/kubernetes/api/v1/nodes/node1', () =>
      HttpResponse.json({ status: { allocatable: { cpu: '4' } } })
    )
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  addBaseHandlers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderComponent() {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ApplicationStatsView))
  );
  return render(<Wrapped />);
}

describe('ApplicationStatsView', () => {
  it('renders the page header "Application stats"', () => {
    server.use(
      http.get('/api/kubernetes/1/metrics/pods/namespace/default/my-pod', () =>
        HttpResponse.json(podMetricsSuccess)
      )
    );

    renderComponent();

    expect(screen.getByText('Application stats')).toBeInTheDocument();
  });

  it('shows "Unable to retrieve container metrics" panel when pod metrics fetch returns 500', async () => {
    server.use(
      http.get('/api/kubernetes/1/metrics/pods/namespace/default/my-pod', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Unable to retrieve container metrics')
      ).toBeInTheDocument();
    });
  });

  it('shows the refresh rate select when metrics are available', async () => {
    server.use(
      http.get('/api/kubernetes/1/metrics/pods/namespace/default/my-pod', () =>
        HttpResponse.json(podMetricsSuccess)
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
      http.get('/api/kubernetes/1/metrics/pods/namespace/default/my-pod', () =>
        HttpResponse.json(podMetricsSuccess)
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: /refresh rate/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText('Unable to retrieve container metrics')
    ).not.toBeInTheDocument();
  });
});
