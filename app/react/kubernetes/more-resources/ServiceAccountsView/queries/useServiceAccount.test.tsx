import { waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { renderHook } from '@testing-library/react-hooks';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { useServiceAccount } from './useServiceAccount';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

function renderQueryHook(namespace: string, name: string) {
  return renderHook(() => useServiceAccount(1, namespace, name), {
    wrapper: withTestQueryProvider(({ children }) => <>{children}</>),
  });
}

describe('useServiceAccount', () => {
  it('returns service account data on success', async () => {
    const mockSA = { name: 'my-sa', namespace: 'default', uid: 'abc-123' };
    server.use(
      http.get(
        '/api/kubernetes/1/namespaces/default/service_accounts/my-sa',
        () => HttpResponse.json(mockSA)
      )
    );

    const { result } = renderQueryHook('default', 'my-sa');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('my-sa');
  });

  it('sets isError on a 500 response', async () => {
    const restoreConsole = suppressConsoleLogs();
    server.use(
      http.get(
        '/api/kubernetes/1/namespaces/default/service_accounts/bad',
        () => HttpResponse.json({ message: 'error' }, { status: 500 })
      )
    );

    const { result } = renderQueryHook('default', 'bad');
    await waitFor(() => expect(result.current.isError).toBe(true));
    restoreConsole();
  });

  it('does not fetch when name is empty', async () => {
    const { result } = renderQueryHook('default', '');
    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  it('does not fetch when namespace is empty', async () => {
    const { result } = renderQueryHook('', 'my-sa');
    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
