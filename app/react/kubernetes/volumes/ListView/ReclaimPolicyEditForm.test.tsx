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
import { ReclaimPolicyEditForm } from './ReclaimPolicyEditForm';
import type { PersistentVolume } from './types';
/* eslint-enable import/first */

const mockUseEnvironmentId = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/volumes/queries/useUpdatePVReclaimPolicy', () => ({
  useUpdatePVReclaimPolicy: () => ({
    mutateAsync: mockMutateAsync,
    isLoading: false,
  }),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

// Mock react-select with a native select for easier testing
vi.mock('@@/form-components/ReactSelect', () => ({
  Select: ({
    value,
    options,
    onChange,
    inputId,
  }: {
    value?: { value: string; label: string };
    options?: { value: string; label: string }[];
    onChange?: (option: { value: string; label: string } | null) => void;
    inputId?: string;
  }) => (
    <select
      id={inputId}
      aria-label="Reclaim Policy"
      value={value?.value}
      onChange={(e) => {
        const selected = options?.find((o) => o.value === e.target.value);
        if (selected) onChange?.(selected);
      }}
    >
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const mockVolume: PersistentVolume = {
  name: 'test-pv',
  accessModes: ['ReadWriteOnce'],
  humanReadableAccessModes: ['ReadWriteOnce'],
  capacity: { storage: '10Gi' },
  claimRef: null,
  storageClassName: 'standard',
  persistentVolumeReclaimPolicy: 'Retain',
  status: 'Available',
  creationDate: '2024-01-01T00:00:00Z',
};

function renderComponent(volume = mockVolume, onDismiss = vi.fn()) {
  const Wrapped = withTestQueryProvider(ReclaimPolicyEditForm);
  return render(<Wrapped volume={volume} onDismiss={onDismiss} />);
}

describe('ReclaimPolicyEditForm', () => {
  beforeEach(() => {
    mockUseEnvironmentId.mockReturnValue(3);
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders the form with the title and current reclaim policy', async () => {
    renderComponent();

    expect(
      await screen.findByText('Edit Persistent Volume Reclaim Policy')
    ).toBeVisible();

    const select = screen.getByRole('combobox', { name: /reclaim policy/i });
    expect(select).toHaveValue('Retain');
  });

  it('shows all available reclaim policy options', async () => {
    renderComponent();

    await screen.findByText('Edit Persistent Volume Reclaim Policy');

    expect(screen.getByRole('option', { name: 'Retain' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Recycle' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Delete' })).toBeInTheDocument();
  });

  it('submits the correct payload when saving the updated policy', async () => {
    const onDismiss = vi.fn();
    renderComponent(mockVolume, onDismiss);

    await screen.findByText('Edit Persistent Volume Reclaim Policy');

    const select = screen.getByRole('combobox', { name: /reclaim policy/i });
    await userEvent.selectOptions(select, 'Delete');

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'test-pv',
        reclaimPolicy: 'Delete',
      });
    });
  });

  it('calls onDismiss after successful submission', async () => {
    const onDismiss = vi.fn();
    renderComponent(mockVolume, onDismiss);

    await screen.findByText('Edit Persistent Volume Reclaim Policy');

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
