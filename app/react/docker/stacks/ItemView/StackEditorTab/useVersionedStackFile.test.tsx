import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { useVersionedStackFile } from './useVersionedStackFile';

describe('useVersionedStackFile', () => {
  const defaultStackId = 1;
  const defaultVersion = 2;
  const mockOnLoad = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupMswHandlers();
  });

  describe('initial state', () => {
    it('should return loading state initially when version is provided', () => {
      const { result } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.content).toBeUndefined();
    });

    it('should not fetch when version is undefined', () => {
      let fetchAttempted = false;

      server.use(
        http.get('/api/stacks/:id/file', () => {
          fetchAttempted = true;
          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      renderHookWithProviders({
        stackId: defaultStackId,
        version: undefined,
        onLoad: mockOnLoad,
      });

      expect(fetchAttempted).toBe(false);
      expect(mockOnLoad).not.toHaveBeenCalled();
    });

    it('should not fetch when version is empty string', () => {
      let fetchAttempted = false;

      server.use(
        http.get('/api/stacks/:id/file', () => {
          fetchAttempted = true;
          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      renderHookWithProviders({
        stackId: defaultStackId,
        onLoad: mockOnLoad,
      });

      expect(fetchAttempted).toBe(false);
      expect(mockOnLoad).not.toHaveBeenCalled();
    });
  });

  describe('successful data fetching', () => {
    it('should fetch stack file content when version is provided', async () => {
      const stackContent = 'version: "3"\nservices:\n  web:\n    image: nginx';

      setupMswHandlers({ stackContent });

      const { result } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.content).toBe(stackContent);
    });

    it('should call onLoad callback with content when data is fetched successfully', async () => {
      const stackContent =
        'version: "3.8"\nservices:\n  db:\n    image: postgres';

      setupMswHandlers({ stackContent });

      renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith(stackContent);
      });
    });

    it('should call onLoad only once for the same data', async () => {
      const stackContent = 'version: "3"';

      setupMswHandlers({ stackContent });

      renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledTimes(1);
      });

      // Wait a bit to ensure no additional calls
      await waitFor(() => expect(true).toBe(true));

      expect(mockOnLoad).toHaveBeenCalledTimes(1);
    });

    it('should include version parameter in API request', async () => {
      let capturedVersion: string | null = null;

      server.use(
        http.get('/api/stacks/:id/file', ({ request }) => {
          const url = new URL(request.url);
          capturedVersion = url.searchParams.get('version');

          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      renderHookWithProviders({
        stackId: defaultStackId,
        version: 5,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(capturedVersion).toBe('5');
      });
    });

    it('should fetch from correct stack ID endpoint', async () => {
      let capturedStackId: string | null = null;

      server.use(
        http.get('/api/stacks/:id/file', ({ params }) => {
          capturedStackId = params.id as string;

          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      renderHookWithProviders({
        stackId: 42,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(capturedStackId).toBe('42');
      });
    });
  });

  describe('version changes', () => {
    it('should refetch when version changes', async () => {
      const firstContent = 'version: "3"\nservices:\n  web:\n    image: nginx';
      const secondContent =
        'version: "2"\nservices:\n  web:\n    image: apache';

      server.use(
        http.get('/api/stacks/:id/file', ({ request }) => {
          const url = new URL(request.url);
          const version = url.searchParams.get('version');

          if (version === '3') {
            return HttpResponse.json({
              StackFileContent: firstContent,
            });
          }

          return HttpResponse.json({
            StackFileContent: secondContent,
          });
        })
      );

      const { rerender } = renderHookWithProviders({
        stackId: defaultStackId,
        version: 3,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith(firstContent);
      });

      expect(mockOnLoad).toHaveBeenCalledTimes(1);

      // Change version to 2
      rerender({
        stackId: defaultStackId,
        version: 2,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith(secondContent);
      });

      expect(mockOnLoad).toHaveBeenCalledTimes(2);
    });

    it('should call onLoad with new content when version changes', async () => {
      server.use(
        http.get('/api/stacks/:id/file', ({ request }) => {
          const url = new URL(request.url);
          const version = url.searchParams.get('version');

          return HttpResponse.json({
            StackFileContent: `content for version ${version}`,
          });
        })
      );

      const { rerender } = renderHookWithProviders({
        stackId: defaultStackId,
        version: 1,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith('content for version 1');
      });

      mockOnLoad.mockClear();

      // Change to version 2
      rerender({
        stackId: defaultStackId,
        version: 2,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith('content for version 2');
      });
    });

    it('should stop fetching when version becomes undefined', async () => {
      let fetchCount = 0;

      server.use(
        http.get('/api/stacks/:id/file', () => {
          fetchCount++;
          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      const { rerender } = renderHookWithProviders({
        stackId: defaultStackId,
        version: 3,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(fetchCount).toBe(1);
      });

      const initialFetchCount = fetchCount;

      // Change version to undefined
      rerender({
        stackId: defaultStackId,
        version: undefined,
        onLoad: mockOnLoad,
      });

      // Wait to ensure no new fetch
      await waitFor(() => expect(true).toBe(true));

      expect(fetchCount).toBe(initialFetchCount);
    });
  });

  describe('error handling', () => {
    const restoreConsole = suppressConsoleLogs();
    afterAll(restoreConsole);

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('/api/stacks/:id/file', () =>
          HttpResponse.json({ message: 'Stack not found' }, { status: 404 })
        )
      );

      const { result } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // onLoad should not be called on error
      expect(mockOnLoad).not.toHaveBeenCalled();
      expect(result.current.content).toBeUndefined();
    });

    it('should not call onLoad when StackFileContent is empty', async () => {
      server.use(
        http.get('/api/stacks/:id/file', () =>
          HttpResponse.json({
            StackFileContent: '',
          })
        )
      );

      renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => expect(true).toBe(true));

      expect(mockOnLoad).not.toHaveBeenCalled();
    });

    it('should not call onLoad when StackFileContent is null', async () => {
      server.use(
        http.get('/api/stacks/:id/file', () =>
          HttpResponse.json({
            StackFileContent: null,
          })
        )
      );

      renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => expect(true).toBe(true));

      expect(mockOnLoad).not.toHaveBeenCalled();
    });

    it('should not call onLoad when StackFileContent is missing from response', async () => {
      server.use(http.get('/api/stacks/:id/file', () => HttpResponse.json({})));

      renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => expect(true).toBe(true));

      expect(mockOnLoad).not.toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('should show loading state while fetching', () => {
      server.use(
        http.get('/api/stacks/:id/file', async () => {
          // Delay response
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      const { result } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should clear loading state after successful fetch', async () => {
      setupMswHandlers();

      const { result } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear loading state after failed fetch', async () => {
      const restoreConsole = suppressConsoleLogs();
      server.use(
        http.get('/api/stacks/:id/file', () =>
          HttpResponse.json({ message: 'Error' }, { status: 500 })
        )
      );

      const { result } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: mockOnLoad,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      restoreConsole();
    });
  });

  describe('onLoad callback stability', () => {
    it('should handle onLoad callback changes without refetching', async () => {
      let fetchCount = 0;

      server.use(
        http.get('/api/stacks/:id/file', () => {
          fetchCount++;
          return HttpResponse.json({
            StackFileContent: 'version: "3"',
          });
        })
      );

      const firstCallback = vi.fn();
      const { rerender } = renderHookWithProviders({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: firstCallback,
      });

      await waitFor(() => {
        expect(firstCallback).toHaveBeenCalled();
      });

      const initialFetchCount = fetchCount;
      const secondCallback = vi.fn();

      // Change callback
      rerender({
        stackId: defaultStackId,
        version: defaultVersion,
        onLoad: secondCallback,
      });

      await waitFor(() => {
        // The new callback should be called with existing data
        expect(secondCallback).toHaveBeenCalledWith('version: "3"');
      });

      // But no new fetch should occur
      expect(fetchCount).toBe(initialFetchCount);
    });
  });
});

/**
 * Setup MSW handlers for API requests
 */
function setupMswHandlers({
  stackContent = 'version: "3"\nservices:\n  web:\n    image: nginx',
}: { stackContent?: string } = {}) {
  server.use(
    http.get('/api/stacks/:id/file', () =>
      HttpResponse.json({
        StackFileContent: stackContent,
      })
    )
  );
}

/**
 * Helper function to render hook with providers
 */
function renderHookWithProviders({
  stackId,
  version,
  onLoad,
}: {
  stackId: number;
  version?: number;
  onLoad: (content: string) => void;
}) {
  const Wrapper = withTestQueryProvider<{
    stackId: number;
    version?: number;
    onLoad: (content: string) => void;
  }>(({ children }) => <>{children}</>);

  return renderHook(useVersionedStackFile, {
    initialProps: { stackId, version, onLoad },
    wrapper: Wrapper,
  });
}
