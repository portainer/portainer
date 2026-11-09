import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';

import { Environment } from '../types';

import { ListView } from './ListView';

const CALLBACK_SETTLE_MS = 50;

vi.mock('@@/modals/confirm', () => ({
  confirmDelete: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

vi.mock('./EnvironmentsDatatable', () => ({
  EnvironmentsDatatable: ({
    onRemove,
  }: {
    onRemove(environments: Environment[]): void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onRemove([
          createMockEnvironment({ Id: 1, Name: 'env-1' }),
          createMockEnvironment({ Id: 2, Name: 'env-2' }),
        ])
      }
    >
      Remove environments
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('shows one success toast when every environment is removed', async () => {
  server.use(
    http.post(
      '/api/endpoints/delete',
      () => new HttpResponse(null, { status: 204 })
    )
  );

  await removeEnvironments();

  expect(notifySuccess).toHaveBeenCalledTimes(1);
  expect(notifySuccess).toHaveBeenCalledWith(
    'Environments successfully removed',
    'env-1, env-2'
  );
});

it('names only the removed environments in the success toast when some fail', async () => {
  server.use(
    http.post('/api/endpoints/delete', () =>
      HttpResponse.json({ deleted: [1], errors: [2] }, { status: 206 })
    )
  );

  await removeEnvironments();

  expect(notifySuccess).toHaveBeenCalledTimes(1);
  expect(notifySuccess).toHaveBeenCalledWith(
    'Environment successfully removed',
    'env-1'
  );
  expect(notifyError).toHaveBeenCalledWith(
    'Failed to remove environment env-2',
    undefined
  );
});

async function removeEnvironments() {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ListView))
  );
  render(<Wrapped />);

  await userEvent.click(
    screen.getByRole('button', { name: 'Remove environments' })
  );

  await waitFor(() => expect(notifySuccess).toHaveBeenCalled());
  await act(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, CALLBACK_SETTLE_MS);
      })
  );
}
