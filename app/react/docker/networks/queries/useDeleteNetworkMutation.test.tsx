import { act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { useDeleteNetwork } from './useDeleteNetworkMutation';
import { useNetwork } from './useNetwork';
import { useNetworks } from './useNetworks';

const environmentId = 1;
const networkId = 'net-1';
const nodeName = 'node-1';

it('does not fetch the deleted network again after a delete', async () => {
  let deleted = false;
  let requestsAfterDelete = 0;
  server.use(
    http.get(`/api/endpoints/${environmentId}/docker/networks/:id`, () => {
      if (!deleted) {
        return HttpResponse.json({ Id: networkId, Name: 'my-network' });
      }

      requestsAfterDelete += 1;
      return HttpResponse.json({}, { status: 404 });
    }),
    http.delete(`/api/endpoints/${environmentId}/docker/networks/:id`, () => {
      deleted = true;
      return new HttpResponse(null, { status: 204 });
    })
  );

  const { result } = renderHook(
    () => ({
      network: useNetwork(environmentId, networkId, { nodeName }),
      deleteNetwork: useDeleteNetwork(environmentId),
    }),
    { wrapper: withTestQueryProvider(Fragment) }
  );

  await waitFor(() => expect(result.current.network.isSuccess).toBe(true));

  await act(async () => {
    await result.current.deleteNetwork.mutateAsync({ networkId, nodeName });
  });
  await waitFor(() => expect(result.current.network.isFetching).toBe(false));

  expect(requestsAfterDelete).toBe(0);
});

it('refreshes the network list after a delete', async () => {
  let listRequests = 0;
  server.use(
    http.get(`/api/endpoints/${environmentId}/docker/networks`, () => {
      listRequests += 1;
      return HttpResponse.json([]);
    }),
    http.delete(
      `/api/endpoints/${environmentId}/docker/networks/:id`,
      () => new HttpResponse(null, { status: 204 })
    )
  );

  const { result } = renderHook(
    () => ({
      networks: useNetworks(environmentId, {}),
      deleteNetwork: useDeleteNetwork(environmentId),
    }),
    { wrapper: withTestQueryProvider(Fragment) }
  );

  await waitFor(() => expect(listRequests).toBe(1));

  await act(async () => {
    await result.current.deleteNetwork.mutateAsync({ networkId, nodeName });
  });

  await waitFor(() => expect(listRequests).toBeGreaterThanOrEqual(2));
});
