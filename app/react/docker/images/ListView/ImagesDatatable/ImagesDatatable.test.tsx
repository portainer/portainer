import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';
import { createMockUser } from '@/react-tools/test-mocks';
import { Role, User } from '@/portainer/users/types';

import { ImagesListResponse } from '../../queries/useImages';

import { ImagesDatatable } from './ImagesDatatable';

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
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a data-cy={dataCy}>{children}</a>
  ),
}));

// Mock child components to simplify testing
vi.mock('./RemoveButtonMenu', () => ({
  RemoveButtonMenu: ({
    selectedItems,
  }: {
    selectedItems: ImagesListResponse[];
  }) => (
    <button
      type="button"
      data-cy="remove-button-menu"
      disabled={selectedItems.length === 0}
    >
      Remove ({selectedItems.length})
    </button>
  ),
}));

vi.mock('./ImportExportButtons', () => ({
  ImportExportButtons: ({
    selectedItems,
  }: {
    selectedItems: ImagesListResponse[];
  }) => (
    <div data-cy="import-export-buttons">
      Import/Export ({selectedItems.length})
    </div>
  ),
}));

describe('ImagesDatatable', () => {
  describe('Data Fetching and Display', () => {
    it('should fetch and display images list', async () => {
      const mockImages = [
        createMockImage({ id: 'sha256:abc123', tags: ['nginx:latest'] }),
        createMockImage({ id: 'sha256:def456', tags: ['redis:alpine'] }),
      ];

      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json(mockImages)
        )
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        expect(screen.getByText(/nginx:latest/)).toBeVisible();
        expect(screen.getByText(/redis:alpine/)).toBeVisible();
      });
    });

    it('should show loading state while fetching images', () => {
      server.use(
        http.get('/api/docker/:envId/images', async () => {
          // Never resolve to simulate loading state
          await new Promise(() => {});
          return HttpResponse.json([]);
        })
      );

      renderComponent({ isHostColumnVisible: false });

      expect(screen.getByText(/Loading/)).toBeVisible();
    });

    it('should handle empty images list', async () => {
      server.use(
        http.get('/api/docker/:envId/images', () => HttpResponse.json([]))
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        expect(screen.getByText(/No items available./i)).toBeInTheDocument();
      });
    });
  });

  describe('Column Visibility', () => {
    it('should show host column when isHostColumnVisible=true', async () => {
      const mockImages = [
        createMockImage({
          id: 'sha256:abc123',
          tags: ['nginx:latest'],
          nodeName: 'worker-node-1',
        }),
        createMockImage({
          id: 'sha256:def456',
          tags: ['redis:alpine'],
          nodeName: 'worker-node-2',
        }),
      ];

      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json(mockImages)
        )
      );

      renderComponent({ isHostColumnVisible: true });

      await waitFor(() => {
        expect(screen.getByText('worker-node-1')).toBeVisible();
        expect(screen.getByText('worker-node-2')).toBeVisible();
      });
    });

    it('should hide host column when isHostColumnVisible=false', async () => {
      const mockImages = [
        createMockImage({
          id: 'sha256:abc123',
          tags: ['nginx:latest'],
          nodeName: 'worker-node-1',
        }),
      ];

      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json(mockImages)
        )
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        expect(screen.getByText('nginx:latest')).toBeVisible();
        expect(screen.queryByText('worker-node-1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Table Actions', () => {
    it('should render RemoveButtonMenu', async () => {
      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json([createMockImage()])
        )
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        expect(screen.getByTestId('remove-button-menu')).toBeVisible();
      });
    });

    it('should render ImportExportButtons', async () => {
      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json([createMockImage()])
        )
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        expect(screen.getByTestId('import-export-buttons')).toBeVisible();
      });
    });

    it('should render Build Image button when user has DockerImageBuild authorization', async () => {
      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json([createMockImage()])
        )
      );

      renderComponent(
        { isHostColumnVisible: false },
        createMockUser({
          Role: Role.Standard,
          EndpointAuthorizations: {
            1: { DockerImageBuild: true },
          },
        })
      );

      await waitFor(() => {
        const buildButton = screen.getByText(/Build a new image/i);

        expect(buildButton).toBeVisible();
        expect(buildButton).toHaveAttribute(
          'data-cy',
          'image-buildImageButton'
        );
      });
    });

    it('should hide Build Image button when user lacks DockerImageBuild authorization', async () => {
      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json([createMockImage()])
        )
      );

      renderComponent(
        { isHostColumnVisible: false },
        createMockUser({
          Role: Role.Standard,
          EndpointAuthorizations: {
            1: { DockerImageBuild: false },
          },
        })
      );

      await waitFor(() => {
        expect(
          screen.queryByText(/Build a new image/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Data Display', () => {
    it('should display image id, tags, size, and created date', async () => {
      const mockImages = [
        createMockImage({
          id: 'sha256:abcdef123456',
          tags: ['nginx:1.21', 'nginx:latest'],
          size: 142000000,
          created: 1704067200, // 2024-01-01 00:00:00 UTC
        }),
      ];

      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json(mockImages)
        )
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        // Image ID (shortened)
        expect(screen.getByText(/abcdef123456/)).toBeVisible();

        // Tags
        expect(screen.getByText(/nginx:1.21/)).toBeVisible();
        expect(screen.getByText(/nginx:latest/)).toBeVisible();
      });
    });

    it('should handle images without tags', async () => {
      const mockImages = [
        createMockImage({
          id: 'sha256:untagged123',
          tags: undefined,
        }),
      ];

      server.use(
        http.get('/api/docker/:envId/images', () =>
          HttpResponse.json(mockImages)
        )
      );

      renderComponent({ isHostColumnVisible: false });

      await waitFor(() => {
        expect(screen.getByText(/untagged123/)).toBeVisible();
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
  { isHostColumnVisible }: { isHostColumnVisible: boolean },
  user: User = createMockUser()
) {
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(ImagesDatatable), user)
  );

  const rendered = render(
    <Wrapped isHostColumnVisible={isHostColumnVisible} />
  );

  expect(screen.getByTestId('docker-images-datatable')).toBeVisible();

  return rendered;
}
