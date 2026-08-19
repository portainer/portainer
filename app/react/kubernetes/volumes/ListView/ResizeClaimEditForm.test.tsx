import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

vi.mock('@@/modals', () => ({
  Modal: {
    Header: ({ title }: { title: string }) => <h2>{title}</h2>,
    Body: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Footer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  },
}));

/* eslint-disable import/first */
import { ResizeClaimEditForm } from './ResizeClaimEditForm';
import type { PersistentVolumeClaim } from './types';
/* eslint-enable import/first */

const mockUseEnvironmentId = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/volumes/queries/useResizePVC', () => ({
  useResizePVC: () => ({
    mutateAsync: mockMutateAsync,
    isLoading: false,
  }),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

const mockClaim: PersistentVolumeClaim = {
  id: 'pvc-1',
  name: 'my-pvc',
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
};

function renderComponent(claim = mockClaim, onDismiss = vi.fn()) {
  const Wrapped = withTestQueryProvider(ResizeClaimEditForm);
  return render(<Wrapped claim={claim} onDismiss={onDismiss} />);
}

describe('ResizeClaimEditForm', () => {
  beforeEach(() => {
    mockUseEnvironmentId.mockReturnValue(3);
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders the form with the claim name in the title and pre-filled size', async () => {
    renderComponent();

    expect(
      await screen.findByText('Resize Persistent Volume Claim')
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: /new size/i })).toHaveValue(
      '10Gi'
    );
  });

  it('shows a validation error when the size field is cleared', async () => {
    renderComponent();

    const sizeInput = await screen.findByRole('textbox', {
      name: /new size/i,
    });

    await userEvent.clear(sizeInput);
    await userEvent.click(screen.getByRole('button', { name: /resize/i }));

    expect(await screen.findByText('New size is required')).toBeVisible();
  });

  it('submits the correct payload when the form is filled and submitted', async () => {
    const onDismiss = vi.fn();
    renderComponent(mockClaim, onDismiss);

    const sizeInput = await screen.findByRole('textbox', {
      name: /new size/i,
    });

    await userEvent.clear(sizeInput);
    await userEvent.type(sizeInput, '20Gi');
    await userEvent.click(screen.getByRole('button', { name: /resize/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        namespace: 'default',
        name: 'my-pvc',
        newSize: '20Gi',
      });
    });
  });

  it('calls onDismiss after successful submission', async () => {
    const onDismiss = vi.fn();
    renderComponent(mockClaim, onDismiss);

    await screen.findByRole('textbox', { name: /new size/i });

    await userEvent.click(screen.getByRole('button', { name: /resize/i }));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
