import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ReactNode } from 'react';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';

import { NodeView } from './NodeView';

let mockParams: { endpointId: number; nodeName: string; tab?: string } = {
  endpointId: 1,
  nodeName: 'test-node',
};

// Mock Link component to avoid ui-router relative state resolution in tests
vi.mock('@@/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
    params,
    ...props
  }: {
    children: ReactNode;
    'data-cy'?: string;
    params?: { tab?: string };
  }) => (
    <a
      data-cy={dataCy}
      href={`#?tab=${params?.tab ?? ''}`}
      onClick={() => {
        if (params?.tab) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          mockParams = { ...mockParams, tab: params.tab };
        }
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({ params: mockParams })),
}));

vi.mock('./NodeApplicationsDatatable/NodeApplicationsDatatable', () => ({
  NodeApplicationsDatatable: () => <div data-cy="apps-table" />,
}));

vi.mock('./NodeDetails/NodeDetails', () => ({
  NodeDetails: () => <div data-cy="node-details">Node details content</div>,
}));

vi.mock('../../components/EventsDatatable/ResourceEventsDatatable', () => ({
  ResourceEventsDatatable: () => (
    <div data-cy="events-table">Events content</div>
  ),
}));

vi.mock('./NodeYamlInspector', () => ({
  NodeYamlInspector: () => <div data-cy="yaml-view">YAML content</div>,
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('../queries/useNodeQuery', () => ({
  useNodeQuery: () => ({ isInitialLoading: false, data: 'uid-123' }),
}));

vi.mock('../../queries/useEvents', () => ({
  useEventWarningsCount: () => 0,
}));

function getWrapped() {
  const user = new UserViewModel({ Username: 'admin' });
  const routerConfig = [{ name: 'root', url: '/' }];
  return withTestQueryProvider(
    withUserProvider(
      withTestRouter(NodeView, { route: 'root', stateConfig: routerConfig }),
      user
    )
  );
}

describe('NodeView tabs', () => {
  it('switches tabs when user clicks different tab', async () => {
    const Wrapped = getWrapped();
    const utils = render(<Wrapped />);

    // initial tab is first: Node details
    expect(screen.queryByTestId('node-details')).toBeVisible();
    expect(screen.queryByTestId('events-table')).toBeNull();
    expect(screen.queryByTestId('yaml-view')).toBeNull();

    // click Events tab and rerender
    screen.getByTestId('tab-1').click();
    utils.rerender(<Wrapped />);
    expect(screen.queryByTestId('node-details')).toBeNull();
    expect(screen.queryByTestId('events-table')).toBeVisible();

    // click YAML tab and rerender
    screen.getByTestId('tab-2').click();
    utils.rerender(<Wrapped />);
    expect(screen.queryByTestId('events-table')).toBeNull();
    expect(screen.queryByTestId('yaml-view')).toBeVisible();

    // back to Node tab (namespace) and rerender
    screen.getByTestId('tab-0').click();
    utils.rerender(<Wrapped />);
    expect(screen.queryByTestId('yaml-view')).toBeNull();
    expect(screen.queryByTestId('node-details')).toBeVisible();
  });
});
