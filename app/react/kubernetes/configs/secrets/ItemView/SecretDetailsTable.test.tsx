import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { vi } from 'vitest';

import { SecretDetailsTable } from './SecretDetailsTable';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/react/hooks/useUser', () => ({
  useAuthorizations: () => ({ authorized: false }),
}));

vi.mock(
  '@/react/kubernetes/more-resources/ServiceAccountsView/ServiceAccountsDatatable/queries/useGetAllServiceAccountsQuery',
  () => ({
    useGetAllServiceAccountsQuery: () => ({ data: [] }),
  })
);

vi.mock(
  '@/react/kubernetes/configs/secrets/queries/useUpdateLinkedServiceAccountsMutation',
  () => ({
    useUpdateLinkedServiceAccountsMutation: () => ({
      isLoading: false,
      mutate: vi.fn(),
    }),
  })
);

vi.mock(
  '@/react/kubernetes/configs/secrets/queries/useSecretsLinkedToDefaultSA',
  () => ({
    useSecretsLinkedToDefaultSA: () => ({ data: [], isLoading: false }),
  })
);

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

describe('SecretDetailsTable', () => {
  it('shows linked service accounts for docker config secrets', () => {
    render(
      <SecretDetailsTable
        name="registry-creds"
        namespace="default"
        secretTypeLabel="Dockerconfigjson"
        isSystem={false}
      />
    );

    expect(screen.getByText('Linked service accounts')).toBeVisible();
    expect(screen.getByText(/No service accounts linked\./)).toBeVisible();
  });

  it('hides linked service accounts for non-image-pull secret types', () => {
    render(
      <SecretDetailsTable
        name="app-secret"
        namespace="default"
        secretTypeLabel="Opaque"
        isSystem={false}
      />
    );

    expect(
      screen.queryByText('Linked service accounts')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No service accounts linked\./)
    ).not.toBeInTheDocument();
  });
});
