import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { useHelmRelease } from './useHelmRelease';
import { useUninstallHelmAppMutation } from './useUninstallHelmAppMutation';

const ENV_ID = 3;
const RELEASE = 'my-release';
const NAMESPACE = 'default';

// Mounts an active release-detail observer next to the uninstall mutation, both
// sharing one query client — the exact situation of the Helm details view.
function Harness() {
  const releaseQuery = useHelmRelease(ENV_ID, RELEASE, NAMESPACE, {
    enabled: true,
  });
  const uninstall = useUninstallHelmAppMutation(ENV_ID);

  return (
    <div>
      <span>{releaseQuery.data?.name ?? 'no-release'}</span>
      <button
        type="button"
        onClick={() =>
          uninstall.mutate({ releaseName: RELEASE, namespace: NAMESPACE })
        }
      >
        uninstall
      </button>
    </div>
  );
}

test('uninstall does not refetch the deleted release or raise an error toast', async () => {
  const user = userEvent.setup();
  let detailGetCount = 0;
  let released = false;
  const onQueryError = vi.fn();

  server.use(
    http.get('/api/endpoints/:id/kubernetes/helm/:name', () => {
      detailGetCount += 1;
      // After deletion the backend responds 404 "Release: not found" — the
      // response that used to surface as a cosmetic error toast (C9S-192).
      if (released) {
        return HttpResponse.json(
          { message: 'Release: not found' },
          { status: 404 }
        );
      }
      return HttpResponse.json({ name: RELEASE, version: 1 });
    }),
    http.delete('/api/endpoints/:id/kubernetes/helm/:name', () => {
      released = true;
      return new HttpResponse(null, { status: 204 });
    })
  );

  const Wrapped = withTestQueryProvider(Harness, { onQueryError });
  render(<Wrapped />);

  // initial detail load
  await waitFor(() => expect(screen.getByText(RELEASE)).toBeVisible());
  expect(detailGetCount).toBe(1);

  await user.click(screen.getByRole('button', { name: 'uninstall' }));

  // let any (unwanted) invalidation-triggered refetch settle
  await waitFor(() => expect(released).toBe(true));
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  // the deleted release must not be refetched, so no 404 and no error toast
  expect(detailGetCount).toBe(1);
  expect(onQueryError).not.toHaveBeenCalled();
});
