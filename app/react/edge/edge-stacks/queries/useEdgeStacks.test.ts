import { useQueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Fragment } from 'react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';

import { queryKeys } from './query-keys';
import { useEdgeStacks } from './useEdgeStacks';

let requestedQueries: string[] = [];

beforeEach(() => {
  requestedQueries = [];
  server.use(
    http.get('/api/edge_stacks', ({ request }) => {
      const { search } = new URL(request.url);
      requestedQueries.push(search);
      return HttpResponse.json([{ Id: 1, Name: search || 'full' }]);
    })
  );
});

describe('useEdgeStacks', () => {
  it('keeps summarized and full lists in separate cache entries', async () => {
    const { result } = renderBothLists();

    await waitFor(() => {
      expect(result.current.full.data?.[0].Name).toBe('full');
      expect(result.current.summarized.data?.[0].Name).toBe(
        '?summarizeStatuses=true'
      );
    });
    expect(requestedQueries).toHaveLength(2);
  });

  it('refetches both lists when the edge stacks base key is invalidated', async () => {
    const { result } = renderBothLists();
    await waitFor(() => expect(requestedQueries).toHaveLength(2));

    await act(() =>
      result.current.queryClient.invalidateQueries(queryKeys.base())
    );

    await waitFor(() => expect(requestedQueries).toHaveLength(4));
  });
});

function renderBothLists() {
  return renderHook(
    () => ({
      queryClient: useQueryClient(),
      full: useEdgeStacks(),
      summarized: useEdgeStacks({ params: { summarizeStatuses: true } }),
    }),
    { wrapper: withTestQueryProvider(Fragment) }
  );
}
