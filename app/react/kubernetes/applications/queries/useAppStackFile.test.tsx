import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { HttpResponse } from 'msw';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { useAppStackFile } from './useAppStackFile';

function renderQueryHook(id: number | undefined, kind: string) {
  return renderHook(() => useAppStackFile(id, kind), {
    wrapper: withTestQueryProvider(({ children }) => <>{children}</>),
  });
}

describe('useAppStackFile', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should return undefined when id is not provided', async () => {
    const { result } = renderQueryHook(undefined, 'kubernetes');

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  it('should fetch regular stack file', async () => {
    const mockContent = 'version: "3.8"\nservices:\n  web:\n    image: nginx';

    server.use(
      http.get('/api/stacks/456/file', () =>
        HttpResponse.json({ StackFileContent: mockContent })
      )
    );

    const { result } = renderQueryHook(456, 'kubernetes');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(mockContent);
  });

  it('should handle fetch error for regular stack', async () => {
    const restoreConsole = suppressConsoleLogs();
    server.use(
      http.get('/api/stacks/999/file', () =>
        HttpResponse.json({ message: 'Stack not found' }, { status: 404 })
      )
    );

    const { result } = renderQueryHook(999, 'kubernetes');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    restoreConsole();
  });

  it('should not fetch when query is disabled', async () => {
    const { result } = renderQueryHook(undefined, 'kubernetes');

    // Wait a bit to ensure no fetch happens
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(result.current.data).toBeUndefined();
  });
});
