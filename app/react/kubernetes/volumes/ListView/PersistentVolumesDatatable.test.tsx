import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { http, server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { usePersistentVolumes } from '@/react/kubernetes/volumes/queries/usePersistentVolumes';

import { PersistentVolumesDatatable } from './PersistentVolumesDatatable';
import type { PersistentVolume } from './types';

const mockUseEnvironmentId = vi.fn();

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/volumes/queries/usePersistentVolumes', () => ({
  usePersistentVolumes: vi.fn(),
}));

vi.mock(
  '@/react/kubernetes/volumes/queries/useDeletePersistentVolumes',
  () => ({
    useDeletePersistentVolumes: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: false,
    })),
  })
);

vi.mock('@/react/kubernetes/volumes/ListView/ReclaimPolicyEditForm', () => ({
  ReclaimPolicyEditForm: ({ volume }: { volume: PersistentVolume }) => (
    <div data-cy="reclaim-policy-form">
      Reclaim policy form for {volume.name}
    </div>
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

const mockPVs: PersistentVolume[] = [
  {
    name: 'test-pv-1',
    accessModes: ['ReadWriteOnce'],
    humanReadableAccessModes: ['ReadWriteOnce'],
    capacity: { storage: '10Gi' },
    claimRef: null,
    storageClassName: 'standard',
    persistentVolumeReclaimPolicy: 'Retain',
    status: 'Available',
    creationDate: '2024-01-01T00:00:00Z',
  },
  {
    name: 'test-pv-2',
    accessModes: ['ReadWriteOnce'],
    humanReadableAccessModes: ['ReadWriteOnce'],
    capacity: { storage: '5Gi' },
    claimRef: {
      kind: 'PersistentVolumeClaim',
      namespace: 'default',
      name: 'my-pvc',
      uid: 'abc-123',
      apiVersion: 'v1',
      resourceVersion: '1000',
    },
    storageClassName: 'standard',
    persistentVolumeReclaimPolicy: 'Delete',
    status: 'Bound',
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
    withUserProvider(withTestRouter(PersistentVolumesDatatable))
  );

  return render(<Wrapped />);
}

describe('PersistentVolumesDatatable', () => {
  beforeEach(() => {
    mockUseEnvironmentId.mockReturnValue(3);
    vi.mocked(usePersistentVolumes).mockReturnValue({
      data: mockPVs,
      isLoading: false,
    } as ReturnType<typeof usePersistentVolumes>);
  });

  it('renders the datatable with PV names and title', async () => {
    renderComponent();

    expect(await screen.findByText('Volumes')).toBeVisible();
    expect(await screen.findByText('test-pv-1')).toBeVisible();
    expect(screen.getByText('test-pv-2')).toBeVisible();
  });

  it('shows an empty table when there are no PVs', async () => {
    vi.mocked(usePersistentVolumes).mockReturnValue({
      data: [] as PersistentVolume[],
      isLoading: false,
    } as ReturnType<typeof usePersistentVolumes>);

    renderComponent();

    expect(await screen.findByText('Volumes')).toBeVisible();
    expect(screen.queryByText('test-pv-1')).not.toBeInTheDocument();
  });

  it('opens the reclaim policy modal when edit is clicked', async () => {
    const { container } = renderComponent();

    await screen.findByText('test-pv-1');

    const editButton = container.querySelector(
      '[data-cy="kubernetes-pv-reclaim-edit-test-pv-1"]'
    ) as HTMLButtonElement;
    expect(editButton).not.toBeNull();

    await userEvent.click(editButton);

    expect(await screen.findByTestId('reclaim-policy-form')).toBeVisible();
    expect(screen.getByText('Reclaim policy form for test-pv-1')).toBeVisible();
  });

  it('does not show the reclaim policy modal initially', async () => {
    renderComponent();

    await screen.findByText('test-pv-1');

    expect(screen.queryByTestId('reclaim-policy-form')).not.toBeInTheDocument();
  });
});
