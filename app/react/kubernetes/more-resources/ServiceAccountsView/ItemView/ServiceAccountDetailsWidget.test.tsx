import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

import { useServiceAccount } from '../queries/useServiceAccount';

import { ServiceAccountDetailsWidget } from './ServiceAccountDetailsWidget';

vi.mock('../queries/useServiceAccount', () => ({
  useServiceAccount: vi.fn(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/react/hooks/useUser', () => ({
  useAuthorizations: () => ({ authorized: false }),
  useCurrentUser: () => ({ isPureAdmin: true }),
}));

vi.mock('@/react/kubernetes/configs/queries/useSecrets', () => ({
  useSecrets: vi.fn(() => ({ data: [] })),
}));

vi.mock(
  '@/react/portainer/environments/queries/useEnvironmentRegistries',
  () => ({
    useEnvironmentRegistries: vi.fn(() => ({
      data: {
        linkedDefaultSecretNames: [],
        registryBySecretName: {},
      },
      isLoading: false,
    })),
  })
);

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

function renderWidget() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ServiceAccountDetailsWidget namespace="default" name="my-sa" />
    </QueryClientProvider>
  );
}

describe('ServiceAccountDetailsWidget', () => {
  it('shows service account name and namespace', () => {
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'my-sa',
        namespace: 'default',
        isSystem: false,
        uid: '',
        creationDate: '',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    expect(screen.getByText('my-sa')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  it('shows image pull secret badges', () => {
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'my-sa',
        namespace: 'default',
        isSystem: false,
        uid: '',
        creationDate: '',
        imagePullSecrets: [{ name: 'registry-creds' }],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    expect(screen.getByText('registry-creds')).toBeInTheDocument();
  });

  it('shows the empty state when there are no image pull secrets', () => {
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'my-sa',
        namespace: 'default',
        isSystem: false,
        uid: '',
        creationDate: '',
        imagePullSecrets: [],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    expect(
      screen.getByText(/No image pull secrets configured\./)
    ).toBeInTheDocument();
  });

  it('truncates image pull secrets beyond the visible limit and shows overflow badge', () => {
    const secrets = Array.from({ length: 7 }, (_, i) => ({
      name: `secret-${i}`,
    }));
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'my-sa',
        namespace: 'default',
        isSystem: false,
        uid: '',
        creationDate: '',
        imagePullSecrets: secrets,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    expect(screen.getByText('+ 2 more')).toBeInTheDocument();
    expect(screen.queryByText('secret-5')).not.toBeInTheDocument();
  });

  it('shows automount token as Disabled when explicitly false', () => {
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'my-sa',
        namespace: 'default',
        isSystem: false,
        uid: '',
        creationDate: '',
        automountServiceAccountToken: false,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows automount token as Enabled when not set', () => {
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'my-sa',
        namespace: 'default',
        isSystem: false,
        uid: '',
        creationDate: '',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows SystemBadge for system service accounts', () => {
    vi.mocked(useServiceAccount).mockReturnValue({
      data: {
        name: 'default',
        namespace: 'kube-system',
        isSystem: true,
        uid: '',
        creationDate: '',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useServiceAccount>);

    renderWidget();
    const systemBadges = screen.getAllByRole('status');
    expect(systemBadges).toHaveLength(2);
    expect(systemBadges[0]).toHaveTextContent('System');
  });
});
