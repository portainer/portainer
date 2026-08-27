import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { StatsView } from './StatsView';

vi.mock('@uirouter/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1, id: 'container1', nodeName: undefined },
  })),
}));

vi.mock('recharts');

const minimalStats = {
  read: '2024-01-01T00:00:01Z',
  preread: '2024-01-01T00:00:00Z',
  cpu_stats: {
    cpu_usage: { total_usage: 2000000, percpu_usage: [1000000, 1000000] },
    system_cpu_usage: 100000000,
  },
  precpu_stats: {
    cpu_usage: { total_usage: 1000000 },
    system_cpu_usage: 90000000,
  },
  memory_stats: {
    usage: 536870912,
    stats: { cache: 0 },
    limit: 2147483648,
  },
  networks: {
    eth0: {
      rx_bytes: 100000,
      tx_bytes: 10000,
      rx_packets: 0,
      rx_errors: 0,
      rx_dropped: 0,
      tx_packets: 0,
      tx_errors: 0,
      tx_dropped: 0,
    },
  },
  blkio_stats: {
    io_service_bytes_recursive: [
      { op: 'Read', value: 1000000, major: 8, minor: 0 },
      { op: 'Write', value: 500000, major: 8, minor: 0 },
    ],
  },
};

function addBaseHandlers() {
  server.use(
    http.get('/api/endpoints/1/docker/containers/container1/json', () =>
      HttpResponse.json({ Name: '/container1', Id: 'container1' })
    ),
    http.get('/api/endpoints/1/docker/containers/container1/top', () =>
      HttpResponse.json({ Processes: [], Titles: [] })
    ),
    http.get('/api/endpoints/1/docker/containers/container1/stats', () =>
      HttpResponse.json(minimalStats)
    )
  );
}

beforeEach(() => {
  addBaseHandlers();
});

function renderComponent() {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(StatsView))
  );
  return render(<Wrapped />);
}

describe('StatsView', () => {
  it('renders the page header "Container statistics"', () => {
    renderComponent();

    expect(screen.getByText('Container statistics')).toBeInTheDocument();
  });

  it('renders the refresh rate select with the correct options', () => {
    renderComponent();

    const select = screen.getByRole('combobox', { name: /refresh rate/i });
    expect(select).toBeInTheDocument();

    const options = Array.from(select.querySelectorAll('option')).map(
      (o) => o.textContent
    );
    expect(options).toEqual(['1s', '3s', '5s', '10s', '30s', '60s']);
  });

  it('shows "Unable to retrieve container statistics" error panel when stats fetch returns 500', async () => {
    const restoreConsole = suppressConsoleLogs();
    server.use(
      http.get('/api/endpoints/1/docker/containers/container1/stats', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderComponent();

    expect(
      await screen.findByText('Unable to retrieve container statistics')
    ).toBeInTheDocument();

    restoreConsole();
  });

  it('shows "Network stats are unavailable" message when stats have empty networks', async () => {
    server.use(
      http.get('/api/endpoints/1/docker/containers/container1/stats', () =>
        HttpResponse.json({ ...minimalStats, networks: {} })
      )
    );

    renderComponent();

    expect(
      await screen.findByText(
        'Network stats are unavailable for this container.'
      )
    ).toBeInTheDocument();
  });

  it('does not render the Network chart widget when networkUnavailable is true', async () => {
    server.use(
      http.get('/api/endpoints/1/docker/containers/container1/stats', () =>
        HttpResponse.json({ ...minimalStats, networks: {} })
      )
    );

    renderComponent();

    expect(
      await screen.findByText(
        'Network stats are unavailable for this container.'
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Network usage (aggregate)')
    ).not.toBeInTheDocument();
  });

  it('shows "I/O stats are unavailable" when stats have blkio_stats: undefined', async () => {
    server.use(
      http.get('/api/endpoints/1/docker/containers/container1/stats', () =>
        HttpResponse.json({ ...minimalStats, blkio_stats: undefined })
      )
    );

    renderComponent();

    expect(
      await screen.findByText('I/O stats are unavailable for this container.')
    ).toBeInTheDocument();
  });
});
