import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';
import { createMockUser } from '@/react-tools/test-mocks';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { CreateImageSection } from './CreateImageSection';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
}));

describe('CreateImageSection', () => {
  beforeEach(() => {
    // Setup MSW handlers for registries API
    server.use(
      http.get('/api/endpoints/:endpointId/registries', () =>
        HttpResponse.json([
          {
            Id: 1,
            Name: 'DockerHub',
            Type: 1,
            URL: 'docker.io',
            Username: 'testuser',
          },
          {
            Id: 2,
            Name: 'Private Registry',
            Type: 3,
            URL: 'registry.example.com',
            Username: '',
          },
        ])
      ),
      // Mock images endpoint for autocomplete functionality
      http.get('/api/endpoints/:endpointId/docker/images/json', () =>
        HttpResponse.json([
          {
            Id: 'sha256:abc123',
            RepoTags: ['docker.io/testuser/my-app:latest', 'nginx:latest'],
          },
          {
            Id: 'sha256:def456',
            RepoTags: ['registry.example.com/another-app:v1.0'],
          },
        ])
      )
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should render widget when user has DockerImageCreate authorization', async () => {
      renderComponent({
        userAuthorizations: {
          DockerImageCreate: true,
        },
      });

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /create image/i })
        ).toBeVisible();
      });
    });

    it('should not render when user lacks authorization', () => {
      renderComponent({
        userAuthorizations: {
          DockerImageCreate: false,
        },
      });

      expect(
        screen.queryByRole('heading', { name: /create image/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Basic Rendering', () => {
    it('should render widget with title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /create image/i })
        ).toBeVisible();
      });
    });

    it('should render description text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/you can create an image from this container/i)
        ).toBeVisible();
      });
    });
  });

  describe('Image Creation', () => {
    it('should successfully create image and call onSuccess', async () => {
      const onSuccess = vi.fn();
      let capturedRequest: {
        container?: string;
        repo?: string;
        tag?: string;
      } = {};

      // Setup MSW handler for commit
      server.use(
        http.post(
          '/api/endpoints/:endpointId/docker/commit',
          async ({ request }) => {
            const url = new URL(request.url);
            capturedRequest = {
              container: url.searchParams.get('container') || undefined,
              repo: url.searchParams.get('repo') || undefined,
              tag: url.searchParams.get('tag') || undefined,
            };
            return HttpResponse.json({ Id: 'sha256:abc123' });
          }
        )
      );

      renderComponent({ onSuccess });

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Image' })).toBeVisible();
      });

      // Fill in image name
      const imageInput = screen.getByRole('combobox', { name: 'Image' });
      await userEvent.type(imageInput, 'my-app:v1.0');

      // Submit form
      const createButton = screen.getByRole('button', { name: /^create$/i });

      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });

      await userEvent.click(createButton);

      // Verify API call
      await waitFor(() => {
        expect(capturedRequest.container).toBe('container123');
        expect(capturedRequest.repo).toBe('my-app');
        expect(capturedRequest.tag).toBe('v1.0');
      });

      // Verify onSuccess callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should handle API error', async () => {
      const onMutationError = vi.fn();
      const restoreConsole = suppressConsoleLogs();

      server.use(
        http.post('/api/endpoints/:endpointId/docker/commit', () =>
          HttpResponse.json({ message: 'Container not found' }, { status: 404 })
        )
      );

      renderComponent({ onMutationError });

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Image' })).toBeVisible();
      });

      const imageInput = screen.getByRole('combobox', { name: 'Image' });
      await userEvent.type(imageInput, 'my-app');

      const createButton = screen.getByRole('button', { name: /^create$/i });

      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });

      await userEvent.click(createButton);

      // Wait for the mutation error to be handled
      await waitFor(
        () => {
          expect(onMutationError).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      restoreConsole();
    });

    it('should show loading state during creation', async () => {
      server.use(
        http.post('/api/endpoints/:endpointId/docker/commit', async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return HttpResponse.json({ Id: 'sha256:abc123' });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Image' })).toBeVisible();
      });

      const imageInput = screen.getByRole('combobox', { name: 'Image' });
      await userEvent.type(imageInput, 'my-app');

      const createButton = screen.getByRole('button', { name: /^create$/i });

      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });

      await userEvent.click(createButton);

      // Check loading state
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /creating image/i })
        ).toBeDisabled();
      });
    });
  });
});

function renderComponent({
  userAuthorizations,
  onMutationError,
  ...componentProps
}: Partial<React.ComponentProps<typeof CreateImageSection>> & {
  userAuthorizations?: Record<string, boolean>;
  onMutationError?: (error: unknown) => void;
} = {}) {
  const defaultProps: React.ComponentProps<typeof CreateImageSection> = {
    environmentId: 1,
    containerId: 'container123',
    ...componentProps,
  };

  const defaultAuthorizations = {
    DockerImageCreate: true,
  };

  const mockUser = createMockUser({
    EndpointAuthorizations: {
      1: userAuthorizations || defaultAuthorizations,
    },
    Id: 1,
    Role: 1,
  });

  const Wrapper = withTestQueryProvider(
    withUserProvider(withTestRouter(CreateImageSection), mockUser),
    onMutationError ? { onMutationError } : undefined
  );

  return render(<Wrapper {...defaultProps} />);
}
