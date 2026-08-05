import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { PruneButton } from './PruneButton';

// Use vi.hoisted to ensure mocks are available before imports
const {
  mockConfirmPruneImages,
  mockNotifySuccess,
  mockNotifyError,
  mockIsAuthorized,
} = vi.hoisted(() => ({
  mockConfirmPruneImages: vi.fn(),
  mockNotifySuccess: vi.fn(),
  mockNotifyError: vi.fn(),
  mockIsAuthorized: vi.fn(),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
}));

vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => ({
    ...(await importOriginal()),
    Authorized: ({
      children,
      childrenUnauthorized = null,
    }: {
      children: React.ReactNode;
      childrenUnauthorized?: React.ReactNode;
    }) => (mockIsAuthorized() ? children : childrenUnauthorized),
  })
);

vi.mock('./ConfirmPruneModal', () => ({
  confirmPruneImages: mockConfirmPruneImages,
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: mockNotifySuccess,
  notifyError: mockNotifyError,
}));

describe('PruneButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    mockConfirmPruneImages.mockResolvedValue(null);
    mockIsAuthorized.mockReturnValue(true);
  });

  afterEach(() => {
    document.body.querySelectorAll('reach-portal').forEach((el) => el.remove());
  });

  describe('Authorization', () => {
    it('should render when user has DockerImagePrune authorization', () => {
      mockIsAuthorized.mockReturnValue(true);

      renderComponent([{ id: 'img1', used: true, tags: ['tag1'] }]);

      expect(screen.getByRole('button', { name: /prune/i })).toBeVisible();
    });

    it('should not render when user lacks DockerImagePrune authorization', () => {
      mockIsAuthorized.mockReturnValue(false);

      renderComponent([{ id: 'img1', used: true, tags: ['tag1'] }]);

      expect(
        screen.queryByRole('button', { name: /prune/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Button State', () => {
    it('should disable button when no prunable images are available', () => {
      mockIsAuthorized.mockReturnValue(true);

      renderComponent([
        { id: 'img1', used: true, tags: ['tag1'] }, // used image with tags
        { id: 'img2', used: true, tags: ['tag2'] }, // used image with tags
      ]);

      const button = screen.getByRole('button', { name: /prune/i });
      expect(button).toBeDisabled();
      // Verify the button is wrapped in a tooltip by checking the parent has aria-expanded
      expect(button.closest('[aria-expanded]')).toBeInTheDocument();
    });

    it('should enable button when unused images are available', () => {
      mockIsAuthorized.mockReturnValue(true);

      renderComponent([
        { id: 'img1', used: true, tags: ['tag1'] },
        { id: 'img2', used: false, tags: ['tag2'] }, // unused image
      ]);

      const button = screen.getByRole('button', { name: /prune/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Prune Flow', () => {
    it('should show confirmation modal when clicked', async () => {
      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      expect(mockConfirmPruneImages).toHaveBeenCalled();
    });

    it('should not call API when user cancels confirmation', async () => {
      mockConfirmPruneImages.mockResolvedValue(null);

      let apiCalled = false;
      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () => {
          apiCalled = true;
          return HttpResponse.json({ ImagesDeleted: [], SpaceReclaimed: 0 });
        })
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      // Wait a bit to ensure no API call was made
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(apiCalled).toBe(false);
    });

    it('should call API with dangling filter when pruneAll is false', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      let requestFilters = '';
      server.use(
        http.post(
          '/api/endpoints/:envId/docker/images/prune',
          ({ request }) => {
            const url = new URL(request.url);
            requestFilters = url.searchParams.get('filters') || '';
            return HttpResponse.json({
              ImagesDeleted: [{ Deleted: 'sha256:abc123' }],
              SpaceReclaimed: 1024000,
            });
          }
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalled();
      });

      expect(JSON.parse(requestFilters)).toEqual({ dangling: ['true'] });
    });

    it('should call API with dangling=false filter when pruneAll is true', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: true,
        clearBuildCache: false,
      });

      let requestFilters = '';
      server.use(
        http.post(
          '/api/endpoints/:envId/docker/images/prune',
          ({ request }) => {
            const url = new URL(request.url);
            requestFilters = url.searchParams.get('filters') || '';
            return HttpResponse.json({
              ImagesDeleted: [
                { Deleted: 'sha256:abc123' },
                { Untagged: 'nginx:latest' },
              ],
              SpaceReclaimed: 5120000,
            });
          }
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalled();
      });

      expect(JSON.parse(requestFilters)).toEqual({ dangling: ['false'] });
    });
  });

  describe('Success Notification', () => {
    it('should show success notification with space reclaimed', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({
            ImagesDeleted: [
              { Untagged: 'sha256:abc123' },
              { Deleted: 'sha256:abc123' },
              { Deleted: 'sha256:def456' },
            ],
            SpaceReclaimed: 104857600, // 100 MB
          })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Images pruned',
          'Reclaimed 104.9 MB'
        );
      });
    });

    it('should show success notification with correct space reclaimed', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({
            ImagesDeleted: [
              { Deleted: 'sha256:abc123' },
              { Deleted: 'sha256:def456' },
              { Untagged: 'nginx:latest' },
            ],
            SpaceReclaimed: 5242880, // 5 MB
          })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Images pruned',
          'Reclaimed 5.2 MB'
        );
      });
    });

    it('should handle small space reclaimed', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({
            ImagesDeleted: [{ Deleted: 'sha256:abc123' }],
            SpaceReclaimed: 2048, // ~2 KB
          })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Images pruned',
          'Reclaimed 2 kB'
        );
      });
    });

    it('should show contextual message when zero bytes reclaimed', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({
            ImagesDeleted: null,
            SpaceReclaimed: 0,
          })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Images pruned',
          'Reclaimed 0 B - the image layers may still be in use by other images, or are still in the Docker build cache.'
        );
      });
    });

    it('should call build cache prune API when clearBuildCache is toggled', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: true,
      });

      let buildPruneCalled = false;
      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({ ImagesDeleted: [], SpaceReclaimed: 0 })
        ),
        http.post('/api/endpoints/:envId/docker/build/prune', () => {
          buildPruneCalled = true;
          return HttpResponse.json({ CachesDeleted: [], SpaceReclaimed: 0 });
        })
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);
      await user.click(screen.getByRole('button', { name: /prune/i }));

      await waitFor(() => expect(mockNotifySuccess).toHaveBeenCalled());
      expect(buildPruneCalled).toBe(true);
    });

    it('should not call build cache prune API when clearBuildCache is false', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      let buildPruneCalled = false;
      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({ ImagesDeleted: [], SpaceReclaimed: 0 })
        ),
        http.post('/api/endpoints/:envId/docker/build/prune', () => {
          buildPruneCalled = true;
          return HttpResponse.json({ CachesDeleted: [], SpaceReclaimed: 0 });
        })
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);
      await user.click(screen.getByRole('button', { name: /prune/i }));

      await waitFor(() => expect(mockNotifySuccess).toHaveBeenCalled());
      expect(buildPruneCalled).toBe(false);
    });

    it('should show combined space reclaimed from image and build cache prune', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: true,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({ ImagesDeleted: [], SpaceReclaimed: 52428800 })
        ),
        http.post('/api/endpoints/:envId/docker/build/prune', () =>
          HttpResponse.json({ CachesDeleted: [], SpaceReclaimed: 52428800 })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);
      await user.click(screen.getByRole('button', { name: /prune/i }));

      await waitFor(() =>
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Images pruned',
          'Reclaimed 104.9 MB'
        )
      );
    });
  });

  describe('Error Handling', () => {
    let restoreConsole: () => void;
    beforeEach(() => {
      restoreConsole = suppressConsoleLogs();
    });
    afterEach(() => {
      restoreConsole();
    });

    it('should show error notification on API failure', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failed to prune images',
          expect.anything()
        );
      });
    });

    it('should show success for images pruned and separate error when build cache prune fails', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: true,
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', () =>
          HttpResponse.json({ ImagesDeleted: [], SpaceReclaimed: 0 })
        ),
        http.post('/api/endpoints/:envId/docker/build/prune', () =>
          HttpResponse.json({ message: 'Server error' }, { status: 500 })
        )
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);
      await user.click(screen.getByRole('button', { name: /prune/i }));

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalledWith(
          'Images pruned',
          expect.stringContaining('Reclaimed 0 B')
        );
        expect(mockNotifyError).toHaveBeenCalledWith(
          'Failed to clear Docker build cache',
          expect.anything()
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while pruning', async () => {
      mockConfirmPruneImages.mockResolvedValue({
        pruneAll: false,
        clearBuildCache: false,
      });

      // Use a deferred promise so we control exactly when the request resolves,
      // avoiding non-deterministic setTimeout timing.
      let resolveRequest!: () => void;
      const requestDeferred = new Promise<void>((resolve) => {
        resolveRequest = resolve;
      });

      server.use(
        http.post('/api/endpoints/:envId/docker/images/prune', async () => {
          await requestDeferred;
          return HttpResponse.json({
            ImagesDeleted: [],
            SpaceReclaimed: 0,
          });
        })
      );

      const user = userEvent.setup();
      renderComponent([{ id: 'img1', used: false, tags: ['tag1'] }]);

      const button = screen.getByRole('button', { name: /prune/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Pruning...')).toBeVisible();
      });

      resolveRequest();

      // Wait for the in-flight request to complete before the test exits.
      await waitFor(() => expect(mockNotifySuccess).toHaveBeenCalled(), {
        timeout: 3000,
      });

      // Flush any remaining queued XHR events (e.g. loadend ProgressEvent) so
      // they fire before jsdom tears down the environment, preventing an
      // "ProgressEvent is not defined" unhandled rejection.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });
  });
});

function renderComponent(
  images: Array<{ id: string; used: boolean; tags: string[] }> = []
) {
  const imagesWithDefaults = images.map((img) => ({
    id: img.id,
    used: img.used,
    tags: img.tags,
    created: 0,
    size: 0,
  }));
  const Wrapped = withTestQueryProvider(
    withTestRouter(() => <PruneButton images={imagesWithDefaults} />)
  );
  return render(<Wrapped />);
}
