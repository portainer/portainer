import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { useStack } from './useStack';
import { useStacks } from './useStacks';
import { useDeleteStackByNameMutation } from './useDeleteStackByNameMutation';

const STACK_ID = 7;
const STACK_NAME = 'my-stack';
const ENV_ID = 3;
const NAMESPACE = 'default';

// Mounts an active stack-detail observer and the stacks-list observer next to
// the delete-by-name mutation, both sharing one query client — the exact
// situation of the Helm upgrade modal (detail) plus the stacks table (list).
function Harness() {
  const stackQuery = useStack(STACK_ID);
  const stacksQuery = useStacks();
  const deleteStack = useDeleteStackByNameMutation();

  return (
    <div>
      <span>{stackQuery.data?.Name ?? 'no-stack'}</span>
      <span data-cy="stack-query-state">
        {stackQuery.status}:{stackQuery.fetchStatus}
      </span>
      <span data-cy="stacks-list-length">
        {stacksQuery.data?.length ?? 'loading'}
      </span>
      <button
        type="button"
        onClick={() =>
          deleteStack.mutate({
            stackId: STACK_ID,
            stackName: STACK_NAME,
            environmentId: ENV_ID,
            namespace: NAMESPACE,
          })
        }
      >
        delete
      </button>
    </div>
  );
}

test('deleting a stack by name refreshes the stacks list but does not refetch the deleted stack (C9S-554)', async () => {
  const user = userEvent.setup();
  let stackGetCount = 0;
  let listGetCount = 0;
  let deleted = false;
  const onQueryError = vi.fn();

  server.use(
    http.get(`/api/stacks/${STACK_ID}`, () => {
      stackGetCount += 1;
      // After deletion the backend responds 404 — an unwanted refetch here
      // used to surface this as an "Unable to retrieve stack" toast (C9S-554).
      if (deleted) {
        return HttpResponse.json(
          { message: 'Stack not found' },
          { status: 404 }
        );
      }
      return HttpResponse.json({ Id: STACK_ID, Name: STACK_NAME });
    }),
    http.get('/api/stacks', () => {
      listGetCount += 1;
      return HttpResponse.json(
        deleted ? [] : [{ Id: STACK_ID, Name: STACK_NAME }]
      );
    }),
    http.delete(`/api/stacks/name/${STACK_NAME}`, () => {
      deleted = true;
      return HttpResponse.json({});
    })
  );

  const Wrapped = withTestQueryProvider(Harness, { onQueryError });
  const { container } = render(<Wrapped />);
  function stacksListLength() {
    return container.querySelector('[data-cy="stacks-list-length"]');
  }

  // initial detail + list load
  await waitFor(() => expect(screen.getByText(STACK_NAME)).toBeVisible());
  await waitFor(() => expect(stacksListLength()).toHaveTextContent('1'));
  expect(stackGetCount).toBe(1);
  expect(listGetCount).toBe(1);

  await user.click(screen.getByRole('button', { name: 'delete' }));

  // the stacks list is mounted and active, so invalidating it refetches
  await waitFor(() => expect(listGetCount).toBe(2));
  // let any (unwanted) invalidation-triggered detail refetch settle too
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  expect(listGetCount).toBe(2);
  // the deleted stack itself must not be refetched, so no 404 and no error toast
  expect(stackGetCount).toBe(1);
  expect(onQueryError).not.toHaveBeenCalled();
});

test('cancels the in-flight request for a deleted stack instead of letting a stale 404 surface as an error (C9S-554)', async () => {
  const user = userEvent.setup();
  let detailGetCalls = 0;
  let deleted = false;
  let resolveDetailGet: (() => void) | undefined;
  const onQueryError = vi.fn();

  const staleDetailGet = new Promise<void>((resolve) => {
    resolveDetailGet = resolve;
  });

  server.use(
    http.get(`/api/stacks/${STACK_ID}`, async () => {
      detailGetCalls += 1;
      // Hold the request open past the delete, reproducing the slow-GET
      // outlives-fast-DELETE race described in the ticket.
      await staleDetailGet;
      return HttpResponse.json(
        { message: 'Stack not found' },
        { status: 404 }
      );
    }),
    http.get('/api/stacks', () => HttpResponse.json([])),
    http.delete(`/api/stacks/name/${STACK_NAME}`, () => {
      deleted = true;
      return HttpResponse.json({});
    })
  );

  const Wrapped = withTestQueryProvider(Harness, { onQueryError });
  const { container } = render(<Wrapped />);
  function stackQueryState() {
    return container.querySelector('[data-cy="stack-query-state"]');
  }

  // delete while the initial detail request is still in flight
  await waitFor(() => {
    expect(detailGetCalls).toBe(1);
    expect(stackQueryState()).toHaveTextContent('fetching');
  });

  await user.click(screen.getByRole('button', { name: 'delete' }));
  await waitFor(() => expect(deleted).toBe(true));

  // only now does the cancelled request's stale 404 arrive
  resolveDetailGet?.();
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  // cancelQueries discarded the stale response: no retry, no error state reached
  expect(detailGetCalls).toBe(1);
  expect(stackQueryState()).not.toHaveTextContent('error');
  expect(onQueryError).not.toHaveBeenCalled();
});
