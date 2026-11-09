import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';

import { WaitingRoomEnvironment } from '../types';

import { TableActions } from './TableActions';

const CALLBACK_SETTLE_MS = 50;

vi.mock('@@/modals/confirm', () => ({
  confirmDelete: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

const devices: WaitingRoomEnvironment[] = [
  createWaitingRoomDevice(1, 'device-1'),
  createWaitingRoomDevice(2, 'device-2'),
];

beforeEach(() => {
  vi.clearAllMocks();
  server.use(
    http.get('/api/system/nodes', () => HttpResponse.json({ nodes: 1 }))
  );
});

it('shows one success toast when every device is removed', async () => {
  server.use(
    http.post(
      '/api/endpoints/delete',
      () => new HttpResponse(null, { status: 204 })
    )
  );

  await removeDevices();

  expect(notifySuccess).toHaveBeenCalledTimes(1);
  expect(notifySuccess).toHaveBeenCalledWith(
    'Environments successfully removed',
    'device-1, device-2'
  );
});

it('names only the removed devices in the success toast when some fail', async () => {
  server.use(
    http.post('/api/endpoints/delete', () =>
      HttpResponse.json({ deleted: [1], errors: [2] }, { status: 206 })
    )
  );

  await removeDevices();

  expect(notifySuccess).toHaveBeenCalledTimes(1);
  expect(notifySuccess).toHaveBeenCalledWith(
    'Environment successfully removed',
    'device-1'
  );
  expect(notifyError).toHaveBeenCalledWith(
    'Failed to remove environment device-2',
    undefined
  );
});

async function removeDevices() {
  const Wrapped = withTestQueryProvider(withUserProvider(TableActions));
  render(<Wrapped selectedRows={devices} />);

  await userEvent.click(screen.getByRole('button', { name: /Remove Device/ }));

  await waitFor(() => expect(notifySuccess).toHaveBeenCalled());
  await act(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, CALLBACK_SETTLE_MS);
      })
  );
}

function createWaitingRoomDevice(
  id: number,
  name: string
): WaitingRoomEnvironment {
  return {
    ...createMockEnvironment({ Id: id, Name: name }),
    EdgeGroups: [],
    Tags: [],
    Group: '',
  };
}
