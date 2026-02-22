import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { ComponentProps } from 'react';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import { createMockUsers, createMockStack } from '@/react-tools/test-mocks';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { Role } from '@/portainer/users/types';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';

import { StackEditorTab } from './StackEditorTab';

const defaultProps = {
  stack: createMockStack({
    EndpointId: 5,
    PreviousDeploymentInfo: {
      Version: 1,
      FileVersion: 2,
    },
    Option: {
      Prune: false,
      Force: false,
    },
    Webhook: '',
  }),
  originalFileContent: 'version: "3"\nservices:\n  web:\n    image: nginx',
  isOrphaned: false,
  containerNames: [],
  originalContainerNames: [],
};

// Mock the hooks and child component
vi.mock('@@/WebEditorForm', () => ({
  usePreventExit: vi.fn(),
}));

vi.mock('./useVersionedStackFile', () => ({
  useVersionedStackFile: vi.fn(),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 5 },
  })),
}));

vi.mock('@/react/common/stacks/common/confirm-stack-update', () => ({
  confirmStackUpdate: vi.fn(() =>
    Promise.resolve({ repullImageAndRedeploy: false })
  ),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  setupMswHandlers();
});

describe('initial loading', () => {
  it('should be empty when environment data is not loaded', async () => {
    const restoreConsole = suppressConsoleLogs();
    setupMswHandlers({ shouldReturnEnv: false });

    const { container } = renderComponent();

    // Wait for queries to settle
    await waitFor(() => {
      expect(container.innerHTML).toBe('<div></div>');
    });

    restoreConsole();
  });

  it('should be empty when schema data is not loaded', async () => {
    setupMswHandlers({ shouldReturnSchema: false });

    const { container } = renderComponent();

    // Wait for queries to settle
    await waitFor(() => {
      expect(container.innerHTML).toBe('<div></div>');
    });
  });

  it('should render StackEditorTabInner when both environment and schema are loaded', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });
  });

  it('should fetch current environment data on mount', async () => {
    let envFetched = false;

    server.use(
      http.get('/api/endpoints/:id', () => {
        envFetched = true;
        return HttpResponse.json({
          Id: 1,
          Name: 'local',
          Type: EnvironmentType.Docker,
        });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(envFetched).toBe(true);
    });
  });

  it('should fetch API version for environment', async () => {
    let versionFetched = false;

    server.use(
      http.get('/api/endpoints/:id/docker/version', () => {
        versionFetched = true;
        return HttpResponse.json({
          ApiVersion: '1.47',
        });
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(versionFetched).toBe(true);
    });
  });
});

describe('form submission', () => {
  it('should show confirmation dialog before submitting', async () => {
    const restoreConsole = suppressConsoleLogs();

    const mockConfirm = vi.mocked(confirmStackUpdate);
    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });

    const deployButton = screen.getByTestId('stack-deploy-button');
    await waitFor(() => {
      expect(deployButton).toBeEnabled();
    });

    await user.click(deployButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        'Do you want to force an update of the stack?',
        false // stackType is DockerCompose
      );
    });

    restoreConsole();
  });

  it('should call mutation API with correct payload', async () => {
    const restoreConsole = suppressConsoleLogs();

    let capturedRequestBody: unknown;

    server.use(
      http.put('/api/stacks/:id', async ({ request }) => {
        capturedRequestBody = await request.json();
        return HttpResponse.json({
          Id: 1,
          Name: 'test-stack',
          Type: 2,
        });
      })
    );

    renderComponent({ stack: createMockStack({ Id: 42 }) });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });

    const deployButton = screen.getByTestId('stack-deploy-button');
    await waitFor(() => {
      expect(deployButton).toBeEnabled();
    });

    await user.click(deployButton);

    await waitFor(
      () => {
        expect(capturedRequestBody).toEqual({
          stackFileContent: defaultProps.originalFileContent,
          env: [],
          prune: false,
          repullImageAndRedeploy: false,
        });
      },
      { timeout: 3000 }
    );

    restoreConsole();
  });

  it('should not submit if confirmation is cancelled', async () => {
    const mockConfirm = vi.mocked(confirmStackUpdate);
    mockConfirm.mockResolvedValueOnce(undefined); // User cancelled

    let mutationCalled = false;
    server.use(
      http.put('/api/stacks/:id', () => {
        mutationCalled = true;
        return HttpResponse.json({ Id: 1 });
      })
    );

    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });

    const deployButton = screen.getByTestId('stack-deploy-button');
    await waitFor(() => {
      expect(deployButton).toBeEnabled();
    });

    await user.click(deployButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });

    // Give some time to ensure mutation doesn't happen
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(mutationCalled).toBe(false);
  });

  it('should call onSubmitSuccess callback and show success notification after mutation completes', async () => {
    const restoreConsole = suppressConsoleLogs();

    const onSubmitSuccess = vi.fn();
    renderComponent({ onSubmitSuccess });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });

    const deployButton = screen.getByTestId('stack-deploy-button');
    await waitFor(() => {
      expect(deployButton).toBeEnabled();
    });

    await user.click(deployButton);

    await waitFor(() => {
      expect(notifySuccess).toHaveBeenCalledWith(
        'Success',
        'Stack successfully deployed'
      );
      expect(onSubmitSuccess).toHaveBeenCalled();
    });

    restoreConsole();
  });

  it('should handle API errors during submission', async () => {
    const restoreConsole = suppressConsoleLogs();

    server.use(
      http.put('/api/stacks/:id', () =>
        HttpResponse.json({ message: 'Stack update failed' }, { status: 500 })
      )
    );

    renderComponent();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });

    const deployButton = screen.getByTestId('stack-deploy-button');
    await waitFor(() => {
      expect(deployButton).toBeEnabled();
    });

    await user.click(deployButton);

    // Verify error notification is called
    await waitFor(() => {
      expect(notifyError).toHaveBeenCalled();
    });

    expect(deployButton).toBeEnabled();
    restoreConsole();
  });
});

describe('container name validation', () => {
  it('should validate container names using provided containerNames', async () => {
    const originalFileContent = `
version: "3"
services:
  web:
    image: nginx
    container_name: existing-container
`;

    const containerNames = ['existing-container', 'other-container'];

    renderComponent({ originalFileContent, containerNames });

    await waitFor(() => {
      expect(
        screen.getByText(/already used by another container/)
      ).toBeVisible();
    });
  });

  it('should not show error when container name is in originalContainerNames', async () => {
    const originalFileContent = `
version: "3"
services:
  web:
    image: nginx
    container_name: my-container
`;

    const containerNames = ['my-container', 'other-container'];
    const originalContainerNames = ['my-container'];

    renderComponent({
      originalFileContent,
      containerNames,
      originalContainerNames,
    });

    await waitFor(() => {
      expect(screen.getByTestId('stack-editor')).toBeInTheDocument();
    });

    // Should not show conflict error
    expect(
      screen.queryByText(/already used by another container/)
    ).not.toBeInTheDocument();
  });

  it('should validate YAML syntax errors', async () => {
    const originalFileContent = 'invalid: [yaml syntax';

    renderComponent({ originalFileContent });

    await waitFor(() => {
      expect(
        screen.getByText(/There is an error in the yaml syntax/)
      ).toBeVisible();
    });
  });
});

/**
 * Setup MSW handlers for API requests
 */
function setupMswHandlers({
  shouldReturnEnv = true,
  shouldReturnSchema = true,
  envType = EnvironmentType.Docker,
  apiVersion = 1.47,
  schema = { type: 'object', properties: {} },
  stackUpdateResponse,
}: {
  shouldReturnEnv?: boolean;
  shouldReturnSchema?: boolean;
  envType?: EnvironmentType;
  apiVersion?: number;
  schema?: object;
  stackUpdateResponse?: object | ((body: unknown) => object);
} = {}) {
  server.use(
    http.get('/api/endpoints/:id', () => {
      if (!shouldReturnEnv) {
        return HttpResponse.json(null, { status: 404 });
      }
      return HttpResponse.json({
        Id: 1,
        Name: 'local',
        Type: envType,
      });
    }),
    http.get('https://raw.githubusercontent.com/*', () => {
      if (!shouldReturnSchema) {
        return HttpResponse.json(null, { status: 404 });
      }
      return HttpResponse.json(schema);
    }),
    http.get('/api/endpoints/:id/docker/version', () =>
      HttpResponse.json({
        ApiVersion: apiVersion.toString(),
      })
    ),
    http.get('/api/endpoints/:id/docker/info', () =>
      HttpResponse.json({
        Swarm: {
          LocalNodeState: 'active',
        },
      })
    ),
    http.put('/api/stacks/:id', async ({ request, params }) => {
      const body = await request.json();

      if (stackUpdateResponse) {
        const response =
          typeof stackUpdateResponse === 'function'
            ? stackUpdateResponse(body)
            : stackUpdateResponse;
        return HttpResponse.json(response);
      }

      // Default success response
      return HttpResponse.json({
        Id: Number(params.id),
        Name: 'test-stack',
        Type: 2,
        EndpointId: 1,
        ...(body as object),
      });
    })
  );
}

type RenderComponentProps = Partial<ComponentProps<typeof StackEditorTab>>;
/**
 * Helper function to render StackEditorTab component
 */
function renderComponent(props: RenderComponentProps = {}) {
  const Component = createComponent();
  return render(<Component {...defaultProps} {...props} />);
}

/**
 * Helper to create component with props and providers
 */
function createComponent() {
  const user = createMockUsers(1, Role.Admin)[0]; // Admin user with all permissions

  return withTestRouter(
    withTestQueryProvider(withUserProvider(StackEditorTab, user))
  );
}
