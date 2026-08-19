import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ReactNode } from 'react';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';

import { ServiceAccountView } from './ServiceAccountView';

let mockParams: {
  endpointId: number;
  namespace: string;
  name: string;
  tab?: string;
} = { endpointId: 1, namespace: 'default', name: 'my-sa' };

vi.mock('@@/Link', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useCurrentStateAndParams: () => ({ params: mockParams }),
  };
});

vi.mock('./ServiceAccountDetailsWidget', () => ({
  ServiceAccountDetailsWidget: () => (
    <div data-testid="sa-details">Details Widget</div>
  ),
}));

vi.mock('./ServiceAccountYAMLEditor', () => ({
  ServiceAccountYAMLEditor: () => (
    <div data-testid="yaml-view">YAML Editor</div>
  ),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

function getWrapped() {
  const user = new UserViewModel({ Username: 'admin' });
  const routerConfig = [{ name: 'root', url: '/' }];
  return withTestQueryProvider(
    withUserProvider(
      withTestRouter(ServiceAccountView, {
        route: 'root',
        stateConfig: routerConfig,
      }),
      user
    )
  );
}

describe('ServiceAccountView', () => {
  beforeEach(() => {
    mockParams = { endpointId: 1, namespace: 'default', name: 'my-sa' };
  });

  it('renders with page title', () => {
    const Wrapped = getWrapped();
    render(<Wrapped />);
    expect(screen.getByText('Service account details')).toBeInTheDocument();
  });

  it('renders service account name in breadcrumb', () => {
    const Wrapped = getWrapped();
    render(<Wrapped />);
    expect(screen.getByText('my-sa')).toBeInTheDocument();
  });
});
