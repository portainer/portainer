import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { createQueryClient } from '@/react-tools/react-query';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { confirmDelete } from '@@/modals/confirm';

import { ItemView } from './ItemView';

const RERENDER_SETTLE_MS = 50;

const mocks = vi.hoisted(() => ({ go: vi.fn() }));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { id: 'net-1', nodeName: undefined, endpointId: 1 },
  })),
  useRouter: vi.fn(() => ({
    stateService: { go: mocks.go, reload: vi.fn() },
  })),
}));

vi.mock('@@/modals/confirm', () => ({
  confirmDelete: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

const network = {
  Id: 'net-1',
  Name: 'test-net',
  Driver: 'bridge',
  Scope: 'local',
  Attachable: false,
  Internal: false,
  IPAM: { Driver: 'default', Config: [], Options: {} },
  Options: {},
  Containers: {},
};

const queryErrorSpy = vi.fn();

let deleted = false;
let deleteRequests = 0;
let networkRequestsAfterDelete = 0;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(confirmDelete).mockResolvedValue(true);

  deleted = false;
  deleteRequests = 0;
  networkRequestsAfterDelete = 0;

  server.use(
    http.get('/api/endpoints/1/docker/networks/net-1', () => {
      if (!deleted) {
        return HttpResponse.json(network);
      }

      networkRequestsAfterDelete += 1;
      return HttpResponse.json({}, { status: 404 });
    }),
    http.delete('/api/endpoints/1/docker/networks/net-1', () => {
      deleteRequests += 1;
      deleted = true;
      return new HttpResponse(null, { status: 204 });
    })
  );
});

it('leaves for the list after a delete without fetching the deleted network again', async () => {
  renderView();

  await userEvent.click(
    await screen.findByRole('button', { name: 'Delete this network' })
  );

  await waitFor(() => expect(mocks.go).toHaveBeenCalledWith('docker.networks'));
  await act(
    () =>
      new Promise((resolve) => {
        setTimeout(resolve, RERENDER_SETTLE_MS);
      })
  );

  expect(deleteRequests).toBe(1);
  expect(notifySuccess).toHaveBeenCalledTimes(1);
  expect(notifySuccess).toHaveBeenCalledWith(
    'Network successfully removed',
    'net-1'
  );
  expect(
    networkRequestsAfterDelete,
    'requests for the deleted network after the delete'
  ).toBe(0);
  expect(queryErrorSpy).not.toHaveBeenCalled();
});

it('stays on the network when the delete fails', async () => {
  const restoreConsole = suppressConsoleLogs();
  try {
    server.use(
      http.delete('/api/endpoints/1/docker/networks/net-1', () =>
        HttpResponse.json(
          {
            message:
              'error while removing network: network test-net has active endpoints',
          },
          { status: 409 }
        )
      )
    );

    renderViewWithAppQueryClient();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete this network' })
    );

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'Failure',
        expect.anything(),
        'Unable to remove network'
      )
    );

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(mocks.go).not.toHaveBeenCalled();
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Delete this network' })
    ).toBeVisible();
  } finally {
    restoreConsole();
  }
});

function renderView() {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ItemView)),
    { onQueryError: queryErrorSpy }
  );

  render(<Wrapped />);
}

function renderViewWithAppQueryClient() {
  const Wrapped = withReactQuery(
    withUserProvider(withTestRouter(ItemView)),
    createQueryClient()
  );

  render(<Wrapped />);
}
