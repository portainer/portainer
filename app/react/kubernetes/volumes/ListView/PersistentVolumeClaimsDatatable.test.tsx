import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { http, server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { usePersistentVolumeClaims } from '@/react/kubernetes/volumes/queries/usePersistentVolumeClaims';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import type { PortainerNamespace } from '@/react/kubernetes/namespaces/types';

import { PersistentVolumeClaimsDatatable } from './PersistentVolumeClaimsDatatable';
import type { PersistentVolumeClaim } from './types';

const mockUseEnvironmentId = vi.fn();

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/volumes/queries/usePersistentVolumeClaims', () => ({
  usePersistentVolumeClaims: vi.fn(),
}));

vi.mock(
  '@/react/kubernetes/volumes/queries/useDeletePersistentVolumeClaims',
  () => ({
    useDeletePersistentVolumeClaims: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
    })),
  })
);

vi.mock('@/react/kubernetes/namespaces/queries/useNamespacesQuery', () => ({
  useNamespacesQuery: vi.fn(),
}));

vi.mock('@/react/kubernetes/volumes/ListView/ResizeClaimEditForm', () => ({
  ResizeClaimEditForm: ({ claim }: { claim: PersistentVolumeClaim }) => (
    <div data-cy="resize-form">Resize form for {claim.name}</div>
  ),
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

const mockPVCs: PersistentVolumeClaim[] = [
  {
    id: 'pvc-1',
    name: 'test-pvc-1',
    namespace: 'default',
    storage: 10737418240,
    storageRequest: '10Gi',
    creationDate: '2024-01-01T00:00:00Z',
    accessModes: ['ReadWriteOnce'],
    humanReadableAccessModes: ['ReadWriteOnce'],
    volumeName: 'pv-1',
    storageClass: 'standard',
    allowVolumeExpansion: true,
    phase: 'Bound',
  },
  {
    id: 'pvc-2',
    name: 'test-pvc-2',
    namespace: 'kube-system',
    storage: 5368709120,
    storageRequest: '5Gi',
    creationDate: '2024-01-02T00:00:00Z',
    accessModes: ['ReadOnlyMany'],
    humanReadableAccessModes: ['ReadOnlyMany'],
    volumeName: 'pv-2',
    storageClass: 'standard',
    allowVolumeExpansion: false,
    phase: 'Pending',
  },
];

const pvcWithWorkload: PersistentVolumeClaim = {
  id: 'pvc-3',
  name: 'used-pvc',
  namespace: 'default',
  storage: 1073741824,
  storageRequest: '1Gi',
  creationDate: '2024-01-03T00:00:00Z',
  accessModes: ['ReadWriteOnce'],
  humanReadableAccessModes: ['ReadWriteOnce'],
  volumeName: 'pv-3',
  storageClass: 'standard',
  allowVolumeExpansion: false,
  phase: 'Bound',
  owningApplications: [
    {
      Name: 'my-deployment',
      ResourcePool: 'default',
      ApplicationType: 'Deployment',
    },
  ],
};

const mockNamespaces = [
  { Name: 'default', IsSystem: false },
  { Name: 'kube-system', IsSystem: true },
] as PortainerNamespace[];

function renderComponent() {
  server.use(
    http.get('/api/endpoints/:endpointId', () =>
      HttpResponse.json(createMockEnvironment())
    )
  );

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(PersistentVolumeClaimsDatatable))
  );

  return render(<Wrapped />);
}

describe('PersistentVolumeClaimsDatatable', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseEnvironmentId.mockReturnValue(3);
    vi.mocked(usePersistentVolumeClaims).mockImplementation(
      (_envId, options) =>
        ({
          data: options?.select ? options.select(mockPVCs) : mockPVCs,
          isLoading: false,
        }) as ReturnType<typeof usePersistentVolumeClaims>
    );
    vi.mocked(useNamespacesQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useNamespacesQuery>);
  });

  it('renders the datatable with PVC names and title', async () => {
    renderComponent();

    expect(await screen.findByText('Volume claims')).toBeVisible();
    expect(await screen.findByText('test-pvc-1')).toBeVisible();
    expect(screen.getByText('test-pvc-2')).toBeVisible();
  });

  it('shows an empty table when there are no PVCs', async () => {
    vi.mocked(usePersistentVolumeClaims).mockImplementation(
      (_envId, options) =>
        ({
          data: options?.select
            ? options.select([] as PersistentVolumeClaim[])
            : [],
          isLoading: false,
        }) as ReturnType<typeof usePersistentVolumeClaims>
    );

    renderComponent();

    expect(await screen.findByText('Volume claims')).toBeVisible();
    expect(screen.queryByText('test-pvc-1')).not.toBeInTheDocument();
  });

  it('opens the resize modal when edit is clicked for an expandable PVC', async () => {
    const { container } = renderComponent();

    await screen.findByText('test-pvc-1');

    const editButton = container.querySelector(
      '[data-cy="kubernetes-pv-resize-edit-test-pvc-1"]'
    ) as HTMLButtonElement;
    expect(editButton).not.toBeNull();
    expect(editButton).not.toBeDisabled();

    await userEvent.click(editButton);

    expect(await screen.findByTestId('resize-form')).toBeVisible();
    expect(screen.getByText('Resize form for test-pvc-1')).toBeVisible();
  });

  it('disables the resize button for PVCs where volume expansion is not allowed', async () => {
    const { container } = renderComponent();

    await screen.findByText('test-pvc-2');

    const editButton = container.querySelector(
      '[data-cy="kubernetes-pv-resize-edit-test-pvc-2"]'
    ) as HTMLButtonElement;

    expect(editButton).toBeDisabled();
  });

  it('does not show the resize modal initially', async () => {
    renderComponent();

    await screen.findByText('test-pvc-1');

    expect(screen.queryByTestId('resize-form')).not.toBeInTheDocument();
  });

  describe('Used by column', () => {
    it('shows the owning application name for PVCs with a workload', async () => {
      vi.mocked(usePersistentVolumeClaims).mockImplementation(
        (_envId, options) => {
          const data = [pvcWithWorkload];
          return {
            data: options?.select ? options.select(data) : data,
            isLoading: false,
          } as ReturnType<typeof usePersistentVolumeClaims>;
        }
      );

      renderComponent();

      expect(await screen.findByText('my-deployment')).toBeVisible();
    });

    it('shows a dash for PVCs with no owning applications', async () => {
      vi.mocked(usePersistentVolumeClaims).mockImplementation(
        (_envId, options) => {
          const data = [mockPVCs[0]];
          return {
            data: options?.select ? options.select(data) : data,
            isLoading: false,
          } as ReturnType<typeof usePersistentVolumeClaims>;
        }
      );

      renderComponent();

      await screen.findByText('test-pvc-1');
      expect(screen.getByText('-')).toBeVisible();
    });
  });

  describe('row selectability', () => {
    it('disables the row checkbox for PVCs with owning applications', async () => {
      vi.mocked(usePersistentVolumeClaims).mockImplementation(
        (_envId, options) => {
          const data = [mockPVCs[0], pvcWithWorkload];
          return {
            data: options?.select ? options.select(data) : data,
            isLoading: false,
          } as ReturnType<typeof usePersistentVolumeClaims>;
        }
      );

      const { container } = renderComponent();

      await screen.findByText('used-pvc');

      // skip header checkbox (index 0); row checkboxes follow in render order
      const rowCheckboxes = Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      ).slice(1);

      const [freeCheckbox, usedCheckbox] = rowCheckboxes;
      expect(freeCheckbox).not.toBeDisabled();
      expect(usedCheckbox).toBeDisabled();
    });

    it('allows selection of a Bound PVC that has no owning applications', async () => {
      vi.mocked(usePersistentVolumeClaims).mockImplementation(
        (_envId, options) => {
          const data = [mockPVCs[0]]; // Bound, no owningApplications
          return {
            data: options?.select ? options.select(data) : data,
            isLoading: false,
          } as ReturnType<typeof usePersistentVolumeClaims>;
        }
      );

      const { container } = renderComponent();

      await screen.findByText('test-pvc-1');

      const rowCheckboxes = Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      ).slice(1);

      expect(rowCheckboxes[0]).not.toBeDisabled();
    });
  });

  it('hides system namespace PVCs by default', async () => {
    vi.mocked(useNamespacesQuery).mockReturnValue({
      data: mockNamespaces,
      isLoading: false,
    } as ReturnType<typeof useNamespacesQuery>);

    renderComponent();

    expect(await screen.findByText('test-pvc-1')).toBeVisible();
    expect(screen.queryByText('test-pvc-2')).not.toBeInTheDocument();
  });

  it('shows system namespace PVCs when showSystemResources is enabled', async () => {
    localStorage.setItem(
      'portainer.datatable_settings_kube-volumes-pvc',
      JSON.stringify({ state: { showSystemResources: true }, version: 1 })
    );
    vi.mocked(useNamespacesQuery).mockReturnValue({
      data: mockNamespaces,
      isLoading: false,
    } as ReturnType<typeof useNamespacesQuery>);

    renderComponent();

    expect(await screen.findByText('test-pvc-1')).toBeVisible();
    expect(screen.getByText('test-pvc-2')).toBeVisible();
  });
});
