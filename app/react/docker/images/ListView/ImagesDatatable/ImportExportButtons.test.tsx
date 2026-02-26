import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';
import { createMockUser } from '@/react-tools/test-mocks';
import { Role } from '@/portainer/users/types';

import { ImagesListResponse } from '../../queries/useImages';

import { ImportExportButtons } from './ImportExportButtons';

// Use vi.hoisted to ensure mocks are available before imports
const { mockConfirmImageExport, mockNotifyWarning, mockSaveAs } = vi.hoisted(
  () => ({
    mockConfirmImageExport: vi.fn(),
    mockNotifyWarning: vi.fn(),
    mockSaveAs: vi.fn(),
  })
);

vi.mock('file-saver', () => ({
  saveAs: mockSaveAs,
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
}));

vi.mock('@@/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
  }: {
    children: React.ReactNode;
    'data-cy'?: string;
  }) => (
    <a data-cy={dataCy} href="/mock-link">
      {children}
    </a>
  ),
}));

// Mock the confirm modal
vi.mock('../../common/ConfirmExportModal', () => ({
  confirmImageExport: mockConfirmImageExport,
}));

// Mock the notification service
vi.mock('@/portainer/services/notifications', () => ({
  notifyWarning: mockNotifyWarning,
}));

describe('ImportExportButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    mockConfirmImageExport.mockResolvedValue(false);
  });

  describe('Authorization', () => {
    it('should render Import button when user has DockerImageLoad authorization', async () => {
      renderComponent(
        [],
        createMockUser({
          Role: Role.Standard,
          EndpointAuthorizations: {
            1: { DockerImageLoad: true },
          },
        })
      );

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /import/i })).toBeVisible();
      });
    });

    it('should render Export button when user has DockerImageGet authorization', async () => {
      renderComponent(
        [],
        createMockUser({
          Role: Role.Standard,
          EndpointAuthorizations: {
            1: { DockerImageGet: true },
          },
        })
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /export/i })).toBeVisible();
      });
    });
  });

  describe('Export Button State', () => {
    it('should disable Export button when no images are selected', async () => {
      renderComponent(
        [],
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).toBeDisabled();
      });
    });

    it('should enable Export button when images are selected', async () => {
      const selectedImages = [
        createMockImage({ id: 'sha256:abc123', tags: ['nginx:latest'] }),
      ];

      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /export/i });
        expect(exportButton).not.toBeDisabled();
      });
    });

    it('should disable Export button while export is in progress', async () => {
      mockConfirmImageExport.mockResolvedValue(true);

      const selectedImages = [
        createMockImage({ id: 'sha256:abc123', tags: ['nginx:latest'] }),
      ];

      server.use(
        http.get('/api/endpoints/:envId/docker/images/get', async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return new Response(new Blob(['image data']), {
            headers: {
              'content-disposition': 'attachment; filename=test.tar',
            },
          });
        })
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Export in progress...')).toBeVisible();
      });
    });
  });

  describe('Export Validation', () => {
    it('should prevent export of untagged images', async () => {
      const selectedImages = [
        createMockImage({
          id: 'sha256:abc123',
          tags: ['<none>'],
        }),
      ];

      let apiCalled = false;
      server.use(
        http.get('/api/endpoints/:envId/docker/images/get', () => {
          apiCalled = true;
          return new Response(new Blob(['image data']), {
            headers: {
              'content-disposition': 'attachment; filename=test.tar',
            },
          });
        })
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      expect(mockNotifyWarning).toHaveBeenCalledWith(
        '',
        'Cannot download an untagged image'
      );
      expect(apiCalled).toBe(false);
      expect(mockConfirmImageExport).not.toHaveBeenCalled();
    });

    it('should prevent export of images from different nodes', async () => {
      const selectedImages = [
        createMockImage({
          id: 'sha256:abc123',
          tags: ['nginx:latest'],
          nodeName: 'node-1',
        }),
        createMockImage({
          id: 'sha256:def456',
          tags: ['redis:alpine'],
          nodeName: 'node-2',
        }),
      ];

      let apiCalled = false;
      server.use(
        http.get('/api/endpoints/:envId/docker/images/get', () => {
          apiCalled = true;
          return new Response(new Blob(['image data']), {
            headers: {
              'content-disposition': 'attachment; filename=test.tar',
            },
          });
        })
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      expect(mockNotifyWarning).toHaveBeenCalledWith(
        '',
        'Cannot download images from different nodes at the same time'
      );
      expect(apiCalled).toBe(false);
      expect(mockConfirmImageExport).not.toHaveBeenCalled();
    });

    it('should allow export of images from the same node', async () => {
      mockConfirmImageExport.mockResolvedValue(true);

      const selectedImages = [
        createMockImage({
          id: 'sha256:abc123',
          tags: ['nginx:latest'],
          nodeName: 'node-1',
        }),
        createMockImage({
          id: 'sha256:def456',
          tags: ['redis:alpine'],
          nodeName: 'node-1',
        }),
      ];

      server.use(
        http.get(
          '/api/endpoints/:envId/docker/images/get',
          () =>
            new Response(new Blob(['image data']), {
              headers: {
                'content-disposition': 'attachment; filename=images.tar',
              },
            })
        )
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockSaveAs).toHaveBeenCalled();
      });
    });
  });

  describe('Export Confirmation Flow', () => {
    it('should show confirmation modal before exporting', async () => {
      mockConfirmImageExport.mockResolvedValue(true);

      const selectedImages = [
        createMockImage({ id: 'sha256:abc123', tags: ['nginx:latest'] }),
      ];

      server.use(
        http.get(
          '/api/endpoints/:envId/docker/images/get',
          () =>
            new Response(new Blob(['image data']), {
              headers: {
                'content-disposition': 'attachment; filename=test.tar',
              },
            })
        )
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      expect(mockConfirmImageExport).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockSaveAs).toHaveBeenCalled();
      });
    });

    it('should not export when user cancels confirmation', async () => {
      const selectedImages = [
        createMockImage({ id: 'sha256:abc123', tags: ['nginx:latest'] }),
      ];

      let apiCalled = false;
      server.use(
        http.get('/api/endpoints/:envId/docker/images/get', () => {
          apiCalled = true;
          return new Response(new Blob(['image data']), {
            headers: {
              'content-disposition': 'attachment; filename=test.tar',
            },
          });
        })
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      mockConfirmImageExport.mockResolvedValue(false);
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockConfirmImageExport).toHaveBeenCalled();
        expect(apiCalled).toBe(false);
        expect(mockSaveAs).not.toHaveBeenCalled();
      });
    });
  });

  describe('Export Success', () => {
    it('should successfully export selected images', async () => {
      mockConfirmImageExport.mockResolvedValue(true);

      const selectedImages = [
        createMockImage({ id: 'sha256:abc123', tags: ['nginx:latest'] }),
        createMockImage({ id: 'sha256:def456', tags: ['redis:alpine'] }),
      ];

      let requestUrl = '';

      server.use(
        http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
          requestUrl = request.url;
          return new Response(new Blob(['image data']), {
            headers: {
              'content-disposition': 'attachment; filename=images.tar',
            },
          });
        })
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockSaveAs).toHaveBeenCalled();
      });

      // Verify the request was made with image names
      expect(requestUrl).toContain('names');
    });

    it('should include nodeName in request when exporting from swarm node', async () => {
      mockConfirmImageExport.mockResolvedValue(true);

      const selectedImages = [
        createMockImage({
          id: 'sha256:abc123',
          tags: ['nginx:latest'],
          nodeName: 'worker-node-1',
        }),
      ];

      let requestHeaders: Record<string, string> = {};

      server.use(
        http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
          requestHeaders = Object.fromEntries(request.headers.entries());
          return new Response(new Blob(['image data']), {
            headers: {
              'content-disposition': 'attachment; filename=test.tar',
            },
          });
        })
      );

      const user = userEvent.setup();
      renderComponent(
        selectedImages,
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageGet: true } },
        })
      );

      const exportButton = await waitFor(() =>
        screen.getByRole('button', { name: /export/i })
      );
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockSaveAs).toHaveBeenCalled();
      });

      expect(requestHeaders['x-portaineragent-target']).toBe('worker-node-1');
    });
  });

  describe('Import Button', () => {
    it('should link to import page', async () => {
      renderComponent(
        [],
        createMockUser({
          EndpointAuthorizations: { 1: { DockerImageLoad: true } },
        })
      );

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /import/i })).toBeVisible();
      });
    });
  });
});

function createMockImage(
  overrides?: Partial<ImagesListResponse>
): ImagesListResponse {
  return {
    id: 'sha256:default123',
    tags: ['test:latest'],
    size: 100000000,
    created: 1704067200,
    used: false,
    nodeName: undefined,
    ...overrides,
  };
}

function renderComponent(
  selectedItems: ImagesListResponse[],
  user = createMockUser()
) {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ImportExportButtons), user)
  );

  return render(<Wrapped selectedItems={selectedItems} />);
}
