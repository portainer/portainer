import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { describe, it, expect, beforeEach } from 'vitest';
import { HttpResponse } from 'msw';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { useResourceYAML } from './useResourceYAML';

const resourcePath = 'api/v1/namespaces/default/configmaps/my-cm';

function renderQueryHook(
  environmentId: number,
  resourcePathArg: string,
  enabled = true
) {
  return renderHook(
    () =>
      useResourceYAML({
        environmentId,
        resourcePath: resourcePathArg,
        enabled,
      }),
    {
      wrapper: withTestQueryProvider(({ children }) => <>{children}</>),
    }
  );
}

describe('useResourceYAML', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('returns YAML text on success', async () => {
    const body = 'apiVersion: v1\nkind: ConfigMap';
    server.use(
      http.get(
        `/api/endpoints/1/kubernetes/${resourcePath}`,
        () =>
          new HttpResponse(body, {
            headers: { 'Content-Type': 'application/yaml' },
          })
      )
    );

    const { result } = renderQueryHook(1, resourcePath);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(body);
  });

  it('sets isError on failure', async () => {
    const restoreConsole = suppressConsoleLogs();
    server.use(
      http.get(`/api/endpoints/1/kubernetes/${resourcePath}`, () =>
        HttpResponse.json({ message: 'error' }, { status: 500 })
      )
    );

    const { result } = renderQueryHook(1, resourcePath);

    await waitFor(() => expect(result.current.isError).toBe(true));
    restoreConsole();
  });

  it('does not fetch when resourcePath is empty', async () => {
    const { result } = renderQueryHook(1, '');

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch when enabled is false', async () => {
    const { result } = renderQueryHook(1, resourcePath, false);

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(result.current.data).toBeUndefined();
  });
});
