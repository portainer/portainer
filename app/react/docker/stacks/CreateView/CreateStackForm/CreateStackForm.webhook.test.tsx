import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultBodyType, http, HttpResponse } from 'msw';
import uuidv4 from 'uuid/v4';
import { Formik } from 'formik';

import { server } from '@/setup-tests/server';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { createMockUsers } from '@/react-tools/test-mocks';
import { Role } from '@/portainer/users/types';

import { mockFormValues } from './test-utils';
import { CreateStackInnerForm } from './CreateStackInnerForm';
import { CreateStackForm } from './CreateStackForm';

vi.mock('uuid/v4', () => ({
  default: vi.fn(() => 'test-webhook-id-1234'),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

describe('CreateStackForm - Webhook ID Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    server.use(
      http.get('/api/endpoints/1', () =>
        HttpResponse.json({
          Id: 1,
          Type: EnvironmentType.Docker,
          ComposeSyntaxMaxVersion: '3',
          ChangeWindow: {
            Enabled: false,
          },
        })
      )
    );
  });

  it('should display webhook ID when webhook is enabled in editor method', async () => {
    const webhookId = 'test-webhook-id-1234';

    renderComponent({
      webhookId,
      initialValues: mockFormValues({
        method: 'editor',
        name: 'test-stack',
        enableWebhook: true,
        editor: {
          fileContent: "version: '3'\nservices:\n  web:\n    image: nginx",
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByTestId('stack-name-input')).toBeInTheDocument();
    });

    await waitFor(() => {
      const webhookDisplay = screen.queryByRole('textbox', {
        name: /webhook url/i,
      });
      expect(webhookDisplay).toBeInTheDocument();
      expect(webhookDisplay).toHaveTextContent(webhookId);
    });

    expect(vi.mocked(uuidv4)).not.toHaveBeenCalled();
  });

  it('should display webhook ID in git repository method with auto-update', async () => {
    const webhookId = 'test-webhook-id-1234';

    server.use(
      http.post('/api/gitops/repo/refs', () =>
        HttpResponse.json(['refs/heads/main', 'refs/heads/develop'])
      ),
      http.post('/api/gitops/repo/files/search', () =>
        HttpResponse.json(['docker-compose.yml'])
      )
    );

    renderComponent({
      webhookId,
      initialValues: mockFormValues({
        method: 'repository',
        name: 'test-stack',
        git: {
          RepositoryURL: 'https://github.com/test/repo',
          RepositoryReferenceName: 'main',
          ComposeFilePathInRepository: 'docker-compose.yml',
          RepositoryAuthentication: false,
          RepositoryUsername: '',
          RepositoryPassword: '',
          RepositoryGitCredentialID: 0,
          TLSSkipVerify: false,
          AdditionalFiles: [],
          AutoUpdate: {
            RepositoryAutomaticUpdates: true,
            RepositoryMechanism: 'Webhook',
            RepositoryFetchInterval: '',
            ForcePullImage: false,
            RepositoryAutomaticUpdatesForce: false,
          },
          RepositoryAuthorizationType: undefined,
          SupportRelativePath: false,
          FilesystemPath: '',
          SaveCredential: false,
          NewCredentialName: '',
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByTestId('stack-name-input')).toBeInTheDocument();
    });

    await waitFor(
      () => {
        const webhookDisplay = screen.queryByRole('textbox', {
          name: /webhook url/i,
        });
        expect(webhookDisplay).toBeInTheDocument();
        expect(webhookDisplay).toHaveTextContent(webhookId);
      },
      { timeout: 3000 }
    );
  });

  it('should not display webhook ID when webhook is disabled', async () => {
    const webhookId = 'test-webhook-id-1234';

    renderComponent({
      webhookId,
      initialValues: mockFormValues({
        method: 'editor',
        name: 'test-stack',
        enableWebhook: false,
        editor: {
          fileContent: "version: '3'\nservices:\n  web:\n    image: nginx",
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByTestId('stack-name-input')).toBeInTheDocument();
    });

    const webhookDisplay = screen.queryByRole('textbox', {
      name: /webhook url/i,
    });
    expect(webhookDisplay).not.toBeInTheDocument();
  });

  it('should call uuid exactly once when CreateStackForm mounts', async () => {
    vi.clearAllMocks();

    renderFullComponent({
      environmentId: 1,
      isSwarm: false,
      swarmId: '',
    });

    await waitFor(() => {
      expect(screen.getByTestId('stack-name-input')).toBeInTheDocument();
    });

    expect(vi.mocked(uuidv4)).toHaveBeenCalledOnce();
  });

  it('should send webhook ID in API request when editor webhook is enabled', async () => {
    const user = userEvent.setup();
    let capturedRequestBody: DefaultBodyType;

    server.use(
      http.post('/api/stacks/create/standalone/string', async ({ request }) => {
        capturedRequestBody = await request.json();
        return HttpResponse.json({
          Id: 1,
          Name: 'test-stack',
          ResourceControl: { Id: 1 },
        });
      }),
      http.put('/api/resource_controls/:id', () => HttpResponse.json({}))
    );

    renderFullComponent({
      environmentId: 1,
      isSwarm: false,
      swarmId: '',
    });

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'test-stack');

    const editor = screen.getByTestId('stack-creation-editor');
    await user.type(editor, 'services:\n  web:\n    image: nginx');

    const webhookToggle = await screen.findByRole('checkbox', {
      name: /create a stack webhook/i,
    });
    await user.click(webhookToggle);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    const deployButton = screen.getByRole('button', {
      name: /deploy the stack/i,
    });
    expect(deployButton).toBeEnabled();

    await user.click(deployButton);

    await waitFor(
      () => {
        expect(capturedRequestBody).toBeDefined();
      },
      { timeout: 3000 }
    );
    assert(capturedRequestBody && typeof capturedRequestBody === 'object');

    expect(capturedRequestBody?.webhook).toBe('test-webhook-id-1234');
  });

  it('should not send webhook ID in API request when editor webhook is disabled', async () => {
    const user = userEvent.setup();
    let capturedRequestBody: DefaultBodyType;

    server.use(
      http.post('/api/stacks/create/standalone/string', async ({ request }) => {
        capturedRequestBody = await request.json();
        return HttpResponse.json({
          Id: 1,
          Name: 'test-stack',
          ResourceControl: { Id: 1 },
        });
      }),
      http.put('/api/resource_controls/:id', () => HttpResponse.json({}))
    );

    renderFullComponent({
      environmentId: 1,
      isSwarm: false,
      swarmId: '',
    });

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'test-stack');

    const editor = screen.getByTestId('stack-creation-editor');
    await user.type(editor, 'services:\n  web:\n    image: nginx');

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    const deployButton = screen.getByRole('button', {
      name: /deploy the stack/i,
    });
    expect(deployButton).toBeEnabled();

    await user.click(deployButton);

    await waitFor(
      () => {
        expect(capturedRequestBody).toBeDefined();
      },
      { timeout: 3000 }
    );

    expect(capturedRequestBody).not.toHaveProperty('webhook');
  });
});

function renderComponent({
  webhookId,
  initialValues,
}: {
  webhookId: string;
  initialValues: ReturnType<typeof mockFormValues>;
}) {
  const user = createMockUsers(1, Role.Admin)[0];

  const Component = withTestRouter(
    withUserProvider(
      withTestQueryProvider(() => (
        <Formik
          initialValues={initialValues}
          onSubmit={async () => {}}
          validateOnMount
        >
          <CreateStackInnerForm
            isSwarm={false}
            isDeploying={false}
            isSaved={false}
            webhookId={webhookId}
          />
        </Formik>
      )),
      user
    )
  );

  return render(<Component />);
}

function renderFullComponent({
  environmentId,
  isSwarm,
  swarmId,
}: {
  environmentId: number;
  isSwarm: boolean;
  swarmId: string;
}) {
  const user = createMockUsers(1, Role.Admin)[0];

  const Component = withTestRouter(
    withUserProvider(
      withTestQueryProvider(() => (
        <CreateStackForm
          environmentId={environmentId}
          isSwarm={isSwarm}
          swarmId={swarmId}
        />
      )),
      user
    )
  );

  return render(<Component />);
}
