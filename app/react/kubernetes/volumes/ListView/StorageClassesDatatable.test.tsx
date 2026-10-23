import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { http, server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { useStorageClasses } from '@/react/kubernetes/volumes/queries/useStorageClasses';

import { StorageClassesDatatable } from './StorageClassesDatatable';
import type { StorageClass } from './types';

const mockUseEnvironmentId = vi.fn();

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/volumes/queries/useStorageClasses', () => ({
  useStorageClasses: vi.fn(),
}));

vi.mock('@/react/kubernetes/volumes/queries/useDeleteStorageClasses', () => ({
  useDeleteStorageClasses: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@/react/kubernetes/volumes/queries/useSetDefaultStorageClass', () => ({
  useSetDefaultStorageClass: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span data-cy="mock-link">{children}</span>
  ),
}));

vi.mock('@/react/kubernetes/components/CreateFromManifestButton', () => ({
  CreateFromManifestButton: ({ 'data-cy': dataCy }: { 'data-cy'?: string }) => (
    <button type="button" data-cy={dataCy}>
      Create from manifest
    </button>
  ),
}));

const mockStorageClasses: StorageClass[] = [
  {
    name: 'standard',
    provisioner: 'k8s.io/minikube-hostpath',
    reclaimPolicy: 'Delete',
    allowVolumeExpansion: true,
    isDefault: true,
    creationDate: '2024-01-01T00:00:00Z',
  },
  {
    name: 'fast-ssd',
    provisioner: 'kubernetes.io/no-provisioner',
    reclaimPolicy: 'Retain',
    allowVolumeExpansion: false,
    isDefault: false,
    creationDate: '2024-01-02T00:00:00Z',
  },
];

function renderComponent() {
  server.use(
    http.get('/api/endpoints/:endpointId', () =>
      HttpResponse.json(createMockEnvironment())
    )
  );

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(StorageClassesDatatable))
  );

  return render(<Wrapped />);
}

describe('StorageClassesDatatable', () => {
  beforeEach(() => {
    mockUseEnvironmentId.mockReturnValue(3);
    vi.mocked(useStorageClasses).mockReturnValue({
      data: mockStorageClasses,
      isLoading: false,
    } as ReturnType<typeof useStorageClasses>);
  });

  it('renders the datatable with storage class names and title', async () => {
    renderComponent();

    expect(await screen.findByText('Storage')).toBeVisible();
    expect(await screen.findByText('standard')).toBeVisible();
    expect(screen.getByText('fast-ssd')).toBeVisible();
  });

  it('shows the Default badge for the default storage class', async () => {
    renderComponent();

    await screen.findByText('standard');

    expect(screen.getByText('Default')).toBeVisible();
  });

  it('disables the set-as-default button for an already-default storage class', async () => {
    const { container } = renderComponent();

    await screen.findByText('standard');

    const setDefaultButton = container.querySelector(
      '[data-cy="k8s-storage-class-set-default-standard"]'
    ) as HTMLButtonElement;
    expect(setDefaultButton).not.toBeNull();
    expect(setDefaultButton).toBeDisabled();
  });

  it('enables the set-as-default button for a non-default storage class', async () => {
    const { container } = renderComponent();

    await screen.findByText('fast-ssd');

    const setDefaultButton = container.querySelector(
      '[data-cy="k8s-storage-class-set-default-fast-ssd"]'
    ) as HTMLButtonElement;
    expect(setDefaultButton).not.toBeNull();
    expect(setDefaultButton).not.toBeDisabled();
  });

  it('shows an empty table when there are no storage classes', async () => {
    vi.mocked(useStorageClasses).mockReturnValue({
      data: [] as StorageClass[],
      isLoading: false,
    } as ReturnType<typeof useStorageClasses>);

    renderComponent();

    expect(await screen.findByText('Storage')).toBeVisible();
    expect(screen.queryByText('standard')).not.toBeInTheDocument();
  });
});
