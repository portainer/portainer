import { vi } from 'vitest';

import { filterNamespaces } from '@/react/kubernetes/applications/components/NamespaceSelector/NamespaceSelector';

const mockUseNamespacesQuery = vi.fn(() => ({
  data: { 1: { Name: 'gamma' }, 2: { Name: 'alpha' }, 3: { Name: 'beta' } },
  isLoading: false,
}));

const mockUseEnvironmentId = vi.fn(() => 1);

vi.mock('@/react/kubernetes/namespaces/queries/useNamespacesQuery', () => ({
  useNamespacesQuery: () => mockUseNamespacesQuery(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

describe('CustomResourceDetailsView', () => {
  it('renders the correct summary widget details for a custom resource', async () => {
    const mockNamespaces = [
      { Name: 'gamma', IsSystem: false },
      { Name: 'alpha', IsSystem: false },
      { Name: 'beta', IsSystem: false },
    ];

    const namespaceSelect = filterNamespaces(mockNamespaces);

    expect(namespaceSelect).toStrictEqual([
      { label: 'alpha', value: 'alpha' },
      { label: 'beta', value: 'beta' },
      { label: 'gamma', value: 'gamma' },
    ]);
  });
});
