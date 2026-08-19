import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { createMockContainer } from '@/react-tools/test-mocks';

import { ContainerDetailsSection } from './ContainerDetailsSection';

function renderComponent(
  container: ContainerDetailsViewModel,
  nodeName?: string
) {
  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(ContainerDetailsSection))
  );

  return render(
    <Wrapped environmentId={1} container={container} nodeName={nodeName} />
  );
}

describe('ContainerDetailsSection', () => {
  test('renders container details correctly', () => {
    const container = createMockContainer({
      Image: 'hash',
      Config: { Image: 'nginx:latest' },
    });

    renderComponent(container);

    expect(screen.getByText('Container details')).toBeVisible();
    expect(screen.getByText('nginx:latest@hash')).toBeVisible();
    expect(screen.getByText('CMD')).toBeVisible();
  });

  test('hides empty sections', () => {
    // make sure container is empty
    const container = {
      Config: {
        Image: 'nginx:latest',
        Cmd: ['nginx'],
        Entrypoint: [],
        Env: [],
        Labels: {},
      },
      HostConfig: {
        RestartPolicy: { Name: 'no', MaximumRetryCount: 0 },
        Sysctls: {},
        DeviceRequests: [],
      },
      NetworkSettings: {
        Ports: {},
      },
    } as unknown as ContainerDetailsViewModel;

    renderComponent(container);

    expect(screen.queryByText('Labels')).not.toBeInTheDocument();
    expect(screen.queryByText('Sysctls')).not.toBeInTheDocument();
    expect(screen.queryByText('GPUS')).not.toBeInTheDocument();
    expect(screen.queryByText('Port configuration')).not.toBeInTheDocument();
  });
});
