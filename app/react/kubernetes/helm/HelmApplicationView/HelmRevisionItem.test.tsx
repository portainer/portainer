import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { mockLocalizeDate } from '@/setup-tests/mock-localizeDate';

import { HelmRelease } from '../types';

import { HelmRevisionItem } from './HelmRevisionItem';

const mockHelmRelease: HelmRelease = {
  name: 'my-release',
  version: 1,
  info: {
    status: 'deployed',
    last_deployed: '2024-01-01T00:00:00Z',
  },
  chart: {
    metadata: {
      name: 'my-app',
      version: '1.0.0',
    },
  },
  manifest: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: my-service',
};

mockLocalizeDate();

vi.mock('@uirouter/react', () => ({
  useCurrentStateAndParams: () => ({
    params: {
      namespace: 'default',
      name: 'my-release',
    },
  }),
}));

const mockUseCurrentStateAndParams = vi.fn();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: () => mockUseCurrentStateAndParams(),
}));

function getTestComponent() {
  return withTestRouter(HelmRevisionItem);
}

describe('HelmRevisionItem', () => {
  it('should display correct revision details', () => {
    const TestComponent = getTestComponent();
    render(
      <TestComponent
        item={mockHelmRelease}
        namespace="default"
        name="my-release"
      />
    );

    // Check status badge
    expect(screen.getByText('Deployed')).toBeInTheDocument();

    // Check revision number
    expect(screen.getByText('Revision #1')).toBeInTheDocument();

    // Check chart name and version
    expect(screen.getByText('my-app-1.0.0')).toBeInTheDocument();

    // Check deployment date
    expect(screen.getByText('Jan 1, 2024, 12:00 AM')).toBeInTheDocument();
  });

  it('should have selected class when currentRevision matches item version', () => {
    const TestComponent = getTestComponent();
    const { container } = render(
      <TestComponent
        item={mockHelmRelease}
        currentRevision={1}
        namespace="default"
        name="my-release"
      />
    );

    const blocklistItem = container.querySelector('.blocklist-item');
    expect(blocklistItem).toHaveClass('blocklist-item--selected');
  });

  it('should not have selected class when currentRevision does not match item version', () => {
    const TestComponent = getTestComponent();
    const { container } = render(
      <TestComponent
        item={mockHelmRelease}
        currentRevision={2}
        namespace="default"
        name="my-release"
      />
    );

    const blocklistItem = container.querySelector('.blocklist-item');
    expect(blocklistItem).not.toHaveClass('blocklist-item--selected');
  });

  it('should not have selected class when currentRevision is undefined', () => {
    const TestComponent = getTestComponent();
    const { container } = render(
      <TestComponent
        item={mockHelmRelease}
        namespace="default"
        name="my-release"
      />
    );

    const blocklistItem = container.querySelector('.blocklist-item');
    expect(blocklistItem).not.toHaveClass('blocklist-item--selected');
  });
});
