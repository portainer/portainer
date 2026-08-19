import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { JSXElementConstructor, ReactElement } from 'react';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { createMockUser } from '@/react-tools/test-mocks';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import { User } from '@/portainer/users/types';

import { NameRow } from './NameRow';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

describe('NameRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display Mode', () => {
    it('displays container name with leading slash trimmed', () => {
      // Test with leading slash
      const { rerender } = renderComponent({ containerName: '/my-container' });
      expect(screen.getByText('my-container')).toBeVisible();
      expect(screen.queryByText('/my-container')).not.toBeInTheDocument();

      // Test without leading slash
      rerenderComponent(rerender, {
        props: {
          containerName: 'already-trimmed',
        },
      });

      expect(screen.getByText('already-trimmed')).toBeVisible();
    });

    it('shows edit button for admin user', async () => {
      const adminUser = createMockUser({ Role: 1 });
      renderComponent({}, adminUser);
      expect(
        await screen.findByRole('button', { name: /edit container name/i })
      ).toBeVisible();
    });

    it('shows edit button for non-admin user with authorization', async () => {
      const authorizedUser = createMockUser({
        Role: 2,
        EndpointAuthorizations: {
          1: {
            DockerContainerRename: true,
          },
        },
      });
      renderComponent({}, authorizedUser);

      await waitFor(async () => {
        expect(
          screen.getByRole('button', { name: /edit container name/i })
        ).toBeVisible();
      });
    });

    it('shows edit button for non-admin user without authorization (CE)', async () => {
      const unauthorizedUser = createMockUser({
        Role: 2,
        EndpointAuthorizations: {
          1: {
            DockerContainerRename: false,
          },
        },
      });
      renderComponent({}, unauthorizedUser);
      expect(
        await screen.findByRole('button', { name: /edit container name/i })
      ).toBeVisible();
    });
  });

  describe('Edit Mode', () => {
    it('enters edit mode with focused input pre-filled with trimmed name', async () => {
      renderComponent({ containerName: '/original-name' });

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const nameInput = screen.getByTestId('containerNameInput');
      expect(nameInput).toBeVisible();
      expect(nameInput).toHaveFocus();
      expect(nameInput).toHaveValue('original-name');
    });

    it('shows cancel and confirm buttons in edit mode', async () => {
      renderComponent();

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      expect(
        screen.getByRole('button', { name: /cancel container name edit/i })
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: /rename container/i })
      ).toBeVisible();
    });

    it('returns to display mode when cancel button is clicked', async () => {
      renderComponent({ containerName: '/my-container' });

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const cancelButton = screen.getByRole('button', {
        name: /cancel container name edit/i,
      });
      await userEvent.click(cancelButton);

      expect(screen.getByText('my-container')).toBeVisible();
      expect(
        screen.queryByTestId('containerNameInput')
      ).not.toBeInTheDocument();
    });

    it('allows editing the container name', async () => {
      renderComponent();

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const nameInput = screen.getByTestId('containerNameInput');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'new-container-name');

      expect(nameInput).toHaveValue('new-container-name');
    });
  });

  describe('Rename Functionality', () => {
    it('successfully renames container with correct API parameters and returns to display mode', async () => {
      let capturedRequest: {
        endpointId: string | null;
        containerId: string | null;
        nodeNameHeader: string | null;
        name: string | null;
      } | null = null;

      const onSuccess = vi.fn();

      server.use(
        http.post(
          '/api/endpoints/:endpointId/docker/containers/:id/rename',
          async ({ params, request }) => {
            const url = new URL(request.url);
            capturedRequest = {
              endpointId: params.endpointId as string,
              containerId: params.id as string,
              nodeNameHeader: request.headers.get('X-PortainerAgent-Target'),
              name: url.searchParams.get('name'),
            };
            return HttpResponse.json({});
          }
        )
      );

      renderComponent({
        containerId: 'container-abc',
        containerName: '/original-name',
        environmentId: 5,
        nodeName: 'swarm-node-2',
        onSuccess,
      });

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const nameInput = screen.getByTestId('containerNameInput');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'updated-name');

      const confirmButton = screen.getByTestId(
        'container-confirm-rename-button'
      );
      expect(confirmButton).not.toBeDisabled();

      await userEvent.click(confirmButton);

      // Button should be disabled during submission
      expect(confirmButton).toBeDisabled();

      // Should call onSuccess callback after successful rename
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });

      // Should return to display mode
      await waitFor(() => {
        expect(
          screen.queryByTestId('containerNameInput')
        ).not.toBeInTheDocument();
      });

      // Verify API was called with correct parameters
      expect(capturedRequest).toEqual({
        endpointId: '5',
        containerId: 'container-abc',
        nodeNameHeader: 'swarm-node-2',
        name: 'updated-name',
      });
    });

    it('does not make API call if name is unchanged', async () => {
      const onSuccess = vi.fn();
      let apiCallCount = 0;

      server.use(
        http.post(
          '/api/endpoints/:endpointId/docker/containers/:id/rename',
          () => {
            apiCallCount += 1;
            return HttpResponse.json({});
          }
        )
      );

      renderComponent({
        containerName: '/same-name',
        onSuccess,
      });

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const confirmButton = screen.getByTestId(
        'container-confirm-rename-button'
      );
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('same-name')).toBeVisible();
      });

      expect(apiCallCount).toBe(0);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('handles rename API error gracefully', async () => {
      // Suppress expected error logs
      const restoreConsole = suppressConsoleLogs();

      server.use(
        http.post(
          '/api/endpoints/:endpointId/docker/containers/:id/rename',
          () =>
            HttpResponse.json(
              { message: 'Container rename failed' },
              { status: 500 }
            )
        )
      );

      renderComponent({ containerName: '/original-name' });

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const nameInput = screen.getByTestId('containerNameInput');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'new-name');

      const confirmButton = screen.getByTestId(
        'container-confirm-rename-button'
      );
      await userEvent.click(confirmButton);

      expect(confirmButton).toBeDisabled();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // Should still be in edit mode with the form visible (not closed on error)
      expect(screen.getByTestId('containerNameInput')).toBeVisible();
      expect(nameInput).toHaveValue('new-name');

      restoreConsole();
    });

    it('validates that container name is required', async () => {
      renderComponent({ containerName: '/original-name' });

      const editButton = await screen.findByRole('button', {
        name: /edit container name/i,
      });
      await userEvent.click(editButton);

      const nameInput = screen.getByTestId('containerNameInput');
      await userEvent.clear(nameInput);

      const confirmButton = screen.getByTestId(
        'container-confirm-rename-button'
      );
      await userEvent.click(confirmButton);

      expect(
        screen.queryByText(/successfully renamed/i)
      ).not.toBeInTheDocument();
    });
  });
});

type RenderProps = Partial<{
  containerId: string;
  containerName: string;
  environmentId: number;
  nodeName: string;
  onSuccess: () => void;
}>;

function createWrappedComponent(
  props: RenderProps,
  user = createMockUser({ Role: 1 })
) {
  const defaultProps = {
    containerId: 'container-123',
    containerName: '/test-container',
    environmentId: 1,
    nodeName: 'node-1',
    onSuccess: vi.fn(),
  };

  const mergedProps = { ...defaultProps, ...props };

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(NameRow, user), {
      route: 'docker.containers.container',
      stateConfig: [
        {
          name: 'docker.containers.container',
          url: '/docker/:endpointId/containers/:id',
          params: { endpointId: '1', id: mergedProps.containerId },
        },
      ],
    })
  );

  return { Wrapped, mergedProps };
}

function renderComponent(
  props: RenderProps = {},
  user = createMockUser({ Role: 1 })
) {
  const { Wrapped, mergedProps } = createWrappedComponent(props, user);
  return render(<Wrapped {...mergedProps} />);
}

function rerenderComponent(
  rerender: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ui: ReactElement<any, string | JSXElementConstructor<any>>
  ) => void,
  { props = {}, user }: { props?: RenderProps; user?: User } = {}
) {
  const { Wrapped, mergedProps } = createWrappedComponent(props, user);
  rerender(<Wrapped {...mergedProps} />);
}
