import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ComponentProps } from 'react';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { notifySuccess } from '@/portainer/services/notifications';
import { confirmDisassociate } from '@/react/portainer/environments/ItemView/ConfirmDisassociateModel';

import { EdgeInformationPanel } from './EdgeInformationPanel';

vi.mock('../ConfirmDisassociateModel');
vi.mock('@/portainer/services/notifications');

describe('EdgeInformationPanel', () => {
  beforeEach(() => {
    vi.mocked(confirmDisassociate).mockResolvedValue(true);
  });

  it('should render edge information correctly', () => {
    const { getByText } = renderComponent();

    expect(
      getByText(/This Edge environment is associated to an Edge environment/)
    ).toBeVisible();
    expect(getByText('test-edge-key-123')).toBeVisible();
    expect(getByText('test-edge-id-456')).toBeVisible();
    expect(getByText('Disassociate')).toBeVisible();
  });

  it('should show confirmation modal on disassociate button click', async () => {
    server.use(
      http.delete('/api/endpoints/:id/association', () => HttpResponse.json({}))
    );

    const { getByRole } = renderComponent();

    const user = userEvent.setup();
    const disassociateButton = getByRole('button', { name: /Disassociate/i });

    await user.click(disassociateButton);

    expect(vi.mocked(confirmDisassociate)).toHaveBeenCalled();
  });

  it('should call mutation on confirm', async () => {
    let mutationCalled = false;

    server.use(
      http.delete('/api/endpoints/:id/association', () => {
        mutationCalled = true;
        return HttpResponse.json({});
      })
    );

    const { getByRole } = renderComponent();

    const user = userEvent.setup();
    const disassociateButton = getByRole('button', { name: /Disassociate/i });

    await user.click(disassociateButton);

    await waitFor(() => {
      expect(mutationCalled).toBe(true);
    });
  });

  it('should show loading state during mutation', async () => {
    server.use(
      http.delete('/api/endpoints/:id/association', async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        return HttpResponse.json({});
      })
    );

    const { getByRole } = renderComponent();

    const user = userEvent.setup();
    const disassociateButton = getByRole('button', { name: /Disassociate/i });

    await user.click(disassociateButton);

    // Check for loading text immediately after click
    await waitFor(() => {
      expect(screen.getByText('Disassociating...')).toBeVisible();
    });
  });

  it('should not call mutation if user cancels confirmation', async () => {
    vi.mocked(confirmDisassociate).mockResolvedValueOnce(false);

    let mutationCalled = false;

    server.use(
      http.delete('/api/endpoints/:id/association', () => {
        mutationCalled = true;
        return HttpResponse.json({});
      })
    );

    const { getByRole } = renderComponent();

    const user = userEvent.setup();
    const disassociateButton = getByRole('button', { name: /Disassociate/i });

    await user.click(disassociateButton);

    // Wait a bit to ensure mutation is not called
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(mutationCalled).toBe(false);
  });

  it('should show notification and call onSuccess callback on successful disassociation', async () => {
    const onSuccessMock = vi.fn();

    server.use(
      http.delete('/api/endpoints/:id/association', () => HttpResponse.json({}))
    );

    const { getByRole } = renderComponent({ onSuccess: onSuccessMock });

    const user = userEvent.setup();
    const disassociateButton = getByRole('button', { name: /Disassociate/i });

    await user.click(disassociateButton);

    await waitFor(() => {
      expect(notifySuccess).toHaveBeenCalledWith(
        'Environment disassociated',
        'Environment successfully disassociated'
      );
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });
});

function renderComponent({
  environmentId = 1,
  edgeKey = 'test-edge-key-123',
  edgeId = 'test-edge-id-456',
  platformName = 'Docker',
  onSuccess = vi.fn(),
}: Partial<ComponentProps<typeof EdgeInformationPanel>> = {}) {
  const Wrapped = withTestQueryProvider(() => (
    <EdgeInformationPanel
      environmentId={environmentId}
      edgeKey={edgeKey}
      edgeId={edgeId}
      platformName={platformName}
      onSuccess={onSuccess}
    />
  ));

  return render(<Wrapped />);
}
