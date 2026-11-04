import { render, screen } from '@testing-library/react';

import { useSystemMetrics } from '@/react/portainer/system/useSystemMetrics';

import { ResourceCharts } from './ResourceCharts';

vi.mock('@/react/portainer/system/useSystemMetrics', () => ({
  useSystemMetrics: vi.fn(),
}));

const mockMetrics = {
  cpu: 45.5,
  cpuCores: 8,
  ram: 62.3,
  ramUsed: 10_000_000_000,
  ramTotal: 16_000_000_000,
  disk: 78.1,
  diskUsed: 234_000_000_000,
  diskTotal: 500_000_000_000,
  diskRead: 1_048_576,
  diskWrite: 524_288,
};

function setup(isOpen: boolean, data?: typeof mockMetrics | null) {
  vi.mocked(useSystemMetrics).mockReturnValue({
    data: data ?? undefined,
  } as ReturnType<typeof useSystemMetrics>);
  return render(<ResourceCharts isOpen={isOpen} />);
}

describe('ResourceCharts', () => {
  it('renders nothing when sidebar is closed', () => {
    const { container } = setup(false, mockMetrics);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when data is not available', () => {
    const { container } = setup(true, null);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders CPU metric with percentage and core count', () => {
    setup(true, mockMetrics);
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('45.5%')).toBeInTheDocument();
    expect(screen.getByText('8 cores')).toBeInTheDocument();
  });

  it('renders RAM metric with formatted byte values', () => {
    setup(true, mockMetrics);
    expect(screen.getByText('RAM')).toBeInTheDocument();
    expect(screen.getByText('62.3%')).toBeInTheDocument();
    expect(screen.getByText('9.3 GB / 14.9 GB')).toBeInTheDocument();
  });

  it('renders Disk metric with formatted byte values', () => {
    setup(true, mockMetrics);
    expect(screen.getByText('Disk')).toBeInTheDocument();
    expect(screen.getByText('78.1%')).toBeInTheDocument();
    expect(screen.getByText('217.9 GB / 465.7 GB')).toBeInTheDocument();
  });

  it('renders Disk I/O with read and write throughput', () => {
    setup(true, mockMetrics);
    expect(screen.getByText('Disk I/O')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB/s')).toBeInTheDocument();
    expect(screen.getByText('512.0 KB/s')).toBeInTheDocument();
  });
});
