import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { vi, type Mock } from 'vitest';

import { server } from '@/setup-tests/server';
import { notifySuccess } from '@/portainer/services/notifications';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { confirm } from '@@/modals/confirm';

import { RollbackButton } from './RollbackButton';

// Mock the confirm modal function
vi.mock('@@/modals/confirm', () => ({
  confirm: vi.fn(() => Promise.resolve(false)),
  buildConfirmButton: vi.fn((label) => ({ label })),
}));

// Mock the notifications service
vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
}));

function renderButton(props = {}) {
  const defaultProps = {
    latestRevision: 3, // So we're rolling back to revision 2
    selectedRevision: 3, // This simulates the selectedRevision from URL params
    environmentId: 1,
    releaseName: 'test-release',
    namespace: 'default',
    ...props,
  };

  const Wrapped = withTestQueryProvider(
    withTestRouter(RollbackButton, {
      route: '/?revision=3',
    })
  );
  return render(<Wrapped {...defaultProps} />);
}

describe('RollbackButton', () => {
  test('should display the revision to rollback to', () => {
    renderButton();

    const button = screen.getByRole('button', { name: /Rollback to #2/i });
    expect(button).toBeInTheDocument();
  });

  test('should be disabled when the rollback mutation is loading', async () => {
    const resolveRequest = vi.fn();
    const requestPromise = new Promise<void>((resolve) => {
      resolveRequest.mockImplementation(() => resolve());
    });

    server.use(
      http.post(
        '/api/endpoints/1/kubernetes/helm/test-release/rollback',
        () =>
          new Promise((resolve) => {
            // Keep request pending to simulate loading state
            requestPromise
              .then(() => {
                resolve(HttpResponse.json({}));
                return null;
              })
              .catch(() => {});
          })
      )
    );

    renderButton();

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /Rollback to #2/i });

    (confirm as Mock).mockResolvedValueOnce(true);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Rolling back...')).toBeInTheDocument();
    });

    resolveRequest();
  });

  test('should show a confirmation modal before executing the rollback', async () => {
    renderButton();

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /Rollback to #2/i });

    await user.click(button);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Are you sure?',
        message: expect.stringContaining(
          'Rolling back will restore the application to revision #2'
        ),
      })
    );
  });

  test('should execute the rollback mutation with correct query params when confirmed', async () => {
    let requestParams: Record<string, string> = {};

    server.use(
      http.post(
        '/api/endpoints/1/kubernetes/helm/test-release/rollback',
        ({ request }) => {
          const url = new URL(request.url);
          requestParams = Object.fromEntries(url.searchParams.entries());
          return HttpResponse.json({});
        }
      )
    );

    renderButton();

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /Rollback to #2/i });

    (confirm as Mock).mockResolvedValueOnce(true);
    await user.click(button);

    await waitFor(() => {
      expect(Object.keys(requestParams).length).toBeGreaterThan(0);
    });

    expect(requestParams.namespace).toBe('default');
    expect(requestParams.revision).toBe('2');

    expect(notifySuccess).toHaveBeenCalledWith(
      'Success',
      'Application rolled back to revision #2 successfully.'
    );
  });

  test('should not execute the rollback if confirmation is cancelled', async () => {
    let wasRequestMade = false;

    server.use(
      http.post(
        '/api/endpoints/1/kubernetes/helm/test-release/rollback',
        () => {
          wasRequestMade = true;
          return HttpResponse.json({});
        }
      )
    );

    renderButton();

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /Rollback to #2/i });

    (confirm as Mock).mockResolvedValueOnce(false);
    await user.click(button);

    await waitFor(() => {
      expect(confirm).toHaveBeenCalled();
    });

    expect(wasRequestMade).toBe(false);
  });
});
