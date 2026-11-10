import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';

import { useContainer } from './useContainer';

const QUERY_SETTLE_MS = 50;

let requestedUrls: string[] = [];

beforeEach(() => {
  requestedUrls = [];
  server.use(
    http.get('/api/endpoints/1/docker/containers/*', ({ request }) => {
      requestedUrls.push(new URL(request.url).pathname);
      return HttpResponse.json({ Id: 'abc' });
    })
  );
});

describe('useContainer', () => {
  it('fetches the container when an id is given', async () => {
    renderHook(() => useContainer({ environmentId: 1, containerId: 'abc' }), {
      wrapper: withTestQueryProvider(Fragment),
    });

    await waitFor(() =>
      expect(requestedUrls).toEqual([
        '/api/endpoints/1/docker/containers/abc/json',
      ])
    );
  });

  it('sends no request when the id is missing and enabled is omitted', async () => {
    renderHook(() => useContainer({ environmentId: 1 }), {
      wrapper: withTestQueryProvider(Fragment),
    });

    await act(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, QUERY_SETTLE_MS);
        })
    );

    expect(requestedUrls).toEqual([]);
  });
});
