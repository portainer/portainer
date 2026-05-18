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
    expect(
      getByText(
        'aHR0cDovL3Rlc3Qtc2VydmVyOjg5OTl8dGVzdC10dW5uZWw6ODAwMHx0ZXN0a2V5fDE'
      )
    ).toBeVisible();
    expect(getByText('http://test-server:8999')).toBeVisible();
    expect(getByText('test-tunnel:8000')).toBeVisible();
    expect(getByText('test-edge-id-456')).toBeVisible();
    expect(getByText('Disassociate')).toBeVisible();
  });

  it('should render empty addresses when edge key is invalid base64', () => {
    const { getByText, queryByText } = renderComponent({
      edgeKey: '!!!not-valid-base64!!!',
    });

    expect(getByText('!!!not-valid-base64!!!')).toBeVisible();
    expect(queryByText('http://test-server:8999')).not.toBeInTheDocument();
    expect(queryByText('test-tunnel:8000')).not.toBeInTheDocument();
  });

  it('should render empty tunnel address when edge key has no pipe separator', () => {
    // valid base64 of a string with no | character
    const { getByText, queryByText } = renderComponent({
      edgeKey: btoa('http://test-server:8999'),
    });

    expect(getByText('http://test-server:8999')).toBeVisible();
    expect(queryByText('test-tunnel:8000')).not.toBeInTheDocument();
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

// base64.RawStdEncoding of 'http://test-server:8999|test-tunnel:8000|testkey|1' (no padding, as produced by Go)
const TEST_EDGE_KEY =
  'aHR0cDovL3Rlc3Qtc2VydmVyOjg5OTl8dGVzdC10dW5uZWw6ODAwMHx0ZXN0a2V5fDE';

function renderComponent({
  environmentId = 1,
  edgeKey = TEST_EDGE_KEY,
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
