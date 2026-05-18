import { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UIRouterContext, UIRouterReact } from '@uirouter/react';
import { vi } from 'vitest';

import { humanize } from '@/portainer/filters/filters';

import { HostDetailsPanel } from './HostDetailsPanel';

vi.mock('../DockerStorageInfo', () => ({
  DockerStorageInfo: () => <span>storage-info</span>,
}));

const mockGo = vi.fn();
const mockRouter = {
  stateService: { go: mockGo },
} as unknown as UIRouterReact;

function renderPanel(
  props: Partial<ComponentProps<typeof HostDetailsPanel>> = {}
) {
  const defaults = {
    host: {
      name: 'my-host',
      totalCPU: 4,
      totalMemory: 1073741824, // 1 GB
    },
    isBrowseEnabled: false,
    browseUrl: 'docker.host.browse',
  };

  return render(
    <UIRouterContext.Provider value={mockRouter}>
      <HostDetailsPanel {...defaults} {...props} />
    </UIRouterContext.Provider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('HostDetailsPanel', () => {
  it('renders the "Host Details" heading', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'Host Details' })).toBeVisible();
  });

  it('renders an icon alongside the heading', () => {
    const { container } = renderPanel();
    expect(container.querySelector('.widget-header svg')).toBeInTheDocument();
  });

  it('renders the hostname', () => {
    renderPanel({ host: { name: 'prod-node', totalCPU: 2, totalMemory: 0 } });
    expect(screen.getByText('prod-node')).toBeVisible();
  });

  it('renders OS information when present', () => {
    renderPanel({
      host: {
        name: 'my-host',
        totalCPU: 4,
        totalMemory: 0,
        os: { type: 'linux', arch: 'amd64', name: 'Ubuntu 22.04' },
      },
    });
    expect(screen.getByText('linux amd64 Ubuntu 22.04')).toBeVisible();
  });

  it('hides the OS row when os is absent', () => {
    renderPanel();
    expect(screen.queryByText('OS Information')).not.toBeInTheDocument();
  });

  it('renders kernel version when present', () => {
    renderPanel({
      host: {
        name: 'my-host',
        totalCPU: 4,
        totalMemory: 0,
        kernelVersion: '5.15.0-105-generic',
      },
    });
    expect(screen.getByText('5.15.0-105-generic')).toBeVisible();
  });

  it('hides the kernel version row when absent', () => {
    renderPanel();
    expect(screen.queryByText('Kernel Version')).not.toBeInTheDocument();
  });

  it('renders total CPU count', () => {
    renderPanel({ host: { name: 'h', totalCPU: 8, totalMemory: 0 } });
    expect(screen.getByText('8')).toBeVisible();
  });

  it('renders total memory as a humanized value', () => {
    const totalMemory = 1073741824;
    const humanizedTotalMemory = humanize(totalMemory);

    if (humanizedTotalMemory === undefined) {
      throw new Error('Expected humanize(totalMemory) to return a value');
    }

    renderPanel({ host: { name: 'h', totalCPU: 1, totalMemory } });
    expect(screen.getByText(humanizedTotalMemory)).toBeVisible();
  });

  describe('disk usage row', () => {
    it('renders the disk usage row when endpointId is provided', () => {
      renderPanel({ endpointId: 1 });
      expect(screen.getByText('Disk usage')).toBeVisible();
      expect(screen.getByText('storage-info')).toBeVisible();
    });

    it('hides the disk usage row when endpointId is absent', () => {
      renderPanel({ endpointId: undefined });
      expect(screen.queryByText('Disk usage')).not.toBeInTheDocument();
    });
  });

  describe('Browse button', () => {
    it('renders the Browse button when isBrowseEnabled is true', () => {
      renderPanel({ isBrowseEnabled: true });
      expect(screen.getByRole('button', { name: 'Browse' })).toBeVisible();
    });

    it('hides the Browse button when isBrowseEnabled is false', () => {
      renderPanel({ isBrowseEnabled: false });
      expect(
        screen.queryByRole('button', { name: 'Browse' })
      ).not.toBeInTheDocument();
    });

    it('navigates to browseUrl when Browse is clicked', async () => {
      const user = userEvent.setup();
      renderPanel({ isBrowseEnabled: true, browseUrl: 'docker.host.browse' });
      await user.click(screen.getByRole('button', { name: 'Browse' }));
      expect(mockGo).toHaveBeenCalledWith('docker.host.browse');
    });
  });
});
