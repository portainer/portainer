import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { createMockStack } from '@/react-tools/test-mocks';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';

import { EditGitSettingsModal } from './EditGitSettingsModal';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: vi.fn(() => 1),
}));

vi.mock('@/react/common/stacks/common/confirm-stack-update', () => ({
  confirmStackUpdate: vi.fn(),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

const mockStack = createMockStack({
  Id: 1,
  EndpointId: 1,
  GitSourceId: 1,
  GitConfig: {
    URL: 'https://github.com/test/repo',
    ReferenceName: 'main',
    ConfigFilePath: 'docker-compose.yml',
    ConfigHash: '',
    TLSSkipVerify: false,
  },
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('EditGitSettingsModal', () => {
  test('saves settings only (no redeploy) — calls POST /stacks/{id}/git and shows success notification', async () => {
    const onClose = vi.fn();
    let settingsApiCalled = false;
    let redeployApiCalled = false;

    server.use(
      http.post('/api/stacks/:id/git', () => {
        settingsApiCalled = true;
        return HttpResponse.json({});
      }),
      http.put('/api/stacks/:id/git/redeploy', () => {
        redeployApiCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderComponent(onClose);

    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(settingsApiCalled).toBe(true);
      expect(redeployApiCalled).toBe(false);
      expect(notifySuccess).toHaveBeenCalledWith(
        'Success',
        'Stack settings saved successfully'
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('saves settings and redeploys when Redeploy is checked and confirmed — calls both endpoints and shows deploy success notification', async () => {
    const onClose = vi.fn();
    let settingsApiCalled = false;
    let redeployApiCalled = false;

    vi.mocked(confirmStackUpdate).mockResolvedValue({
      repullImageAndRedeploy: false,
    });

    server.use(
      http.post('/api/stacks/:id/git', () => {
        settingsApiCalled = true;
        return HttpResponse.json({});
      }),
      http.put('/api/stacks/:id/git/redeploy', () => {
        redeployApiCalled = true;
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderComponent(onClose);

    await user.click(screen.getByRole('checkbox', { name: /redeploy/i }));
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(confirmStackUpdate).toHaveBeenCalled();
      expect(settingsApiCalled).toBe(true);
      expect(redeployApiCalled).toBe(true);
      expect(notifySuccess).toHaveBeenCalledWith(
        'Success',
        'Stack deployed successfully'
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('shows error notification when settings save succeeds but redeploy fails', async () => {
    const onClose = vi.fn();

    vi.mocked(confirmStackUpdate).mockResolvedValue({
      repullImageAndRedeploy: false,
    });

    server.use(
      http.post('/api/stacks/:id/git', () => HttpResponse.json({})),
      http.put('/api/stacks/:id/git/redeploy', () =>
        HttpResponse.json({ message: 'Redeploy failed' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderComponent(onClose);

    await user.click(screen.getByRole('checkbox', { name: /redeploy/i }));
    await user.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(notifyError).toHaveBeenCalledWith(
        'Failure',
        expect.any(Error),
        'Stack settings saved but redeploy failed'
      );
      expect(onClose).toHaveBeenCalled();
    });
  });
});

function renderComponent(onClose = vi.fn()) {
  server.use(
    http.get('/api/gitops/sources', () =>
      HttpResponse.json([
        {
          id: 1,
          name: 'test-source',
          type: 'git',
          url: 'https://github.com/test/repo',
          status: 'valid',
          usedBy: 0,
          environments: 0,
          lastSync: 0,
        },
      ])
    ),
    http.post('/api/gitops/repo/refs', () => HttpResponse.json([])),
    http.post('/api/gitops/repo/files/search', () => HttpResponse.json([]))
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EditGitSettingsModal))
  );

  return render(<Wrapped stack={mockStack} onClose={onClose} />);
}
