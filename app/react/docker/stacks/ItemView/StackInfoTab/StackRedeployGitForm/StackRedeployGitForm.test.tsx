import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HttpResponse } from 'msw';
import _ from 'lodash';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';
import { confirmEnableTLSVerify } from '@/react/portainer/gitops/utils';
import {
  baseStackWebhookUrl,
  createWebhookId,
} from '@/portainer/helpers/webhookHelper';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { Stack } from '@/react/common/stacks/types';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';
import { http, server } from '@/setup-tests/server';
import { DeepPartial } from '@/types';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { StackRedeployGitForm } from './StackRedeployGitForm';

type StackRedeployGitFormProps = React.ComponentProps<
  typeof StackRedeployGitForm
>;

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),

  useRouter: vi.fn(() => ({
    stateService: {
      reload: vi.fn(),
    },
  })),
}));

vi.mock('@/react/common/stacks/common/confirm-stack-update', () => ({
  confirmStackUpdate: vi.fn(),
}));

vi.mock('@/react/portainer/gitops/utils', () => ({
  confirmEnableTLSVerify: vi.fn(),
}));

vi.mock('@/portainer/helpers/webhookHelper', () => ({
  baseStackWebhookUrl: vi.fn(),
  createWebhookId: vi.fn(),
}));

vi.mock('@/react/portainer/gitops/AutoUpdateFieldset/utils', () => ({
  parseAutoUpdateResponse: vi.fn(() => ({
    RepositoryAutomaticUpdates: true,
    RepositoryMechanism: 'Webhook',
    RepositoryFetchInterval: '5m',
    ForcePullImage: false,
    RepositoryAutomaticUpdatesForce: false,
  })),
  transformAutoUpdateViewModel: vi.fn(
    (_viewModel: unknown, webhookId: string) => ({
      Interval: '',
      Webhook: webhookId,
      ForceUpdate: false,
      ForcePullImage: false,
    })
  ),
}));

// Mock router hooks
vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: vi.fn(() => 1),
}));

vi.mock('@/react/hooks/useCurrentEnvironment', () => ({
  useCurrentEnvironment: vi.fn(() => ({ Id: 1, Name: 'test' })),
}));

// Mock components that require router context
vi.mock('@/react/portainer/gitops/TimeWindowDisplay', () => ({
  TimeWindowDisplay: vi.fn(() => (
    <div data-testid="time-window-display">Time Window Display</div>
  )),
}));

vi.mock(
  '@/react/components/form-components/EnvironmentVariablesFieldset/StackEnvironmentVariablesPanel',
  () => ({
    StackEnvironmentVariablesPanel: vi.fn(() => (
      <div data-testid="environment-variables-panel">
        Environment Variables Panel
      </div>
    )),
  })
);

vi.mock('@/react/portainer/gitops/InfoPanel', () => ({
  InfoPanel: vi.fn(({ url, configFilePath }) => (
    <div data-testid="info-panel">
      <span>{url}</span>
      <span>{configFilePath}</span>
    </div>
  )),
}));

vi.mock('@/react/portainer/gitops/AutoUpdateFieldset', () => ({
  AutoUpdateFieldset: vi.fn(() => (
    <div data-testid="auto-update-fieldset">Auto Update Fieldset</div>
  )),
}));

vi.mock('@/react/portainer/gitops/RefField', () => ({
  RefField: vi.fn(() => <div data-testid="ref-field">Ref Field</div>),
}));

vi.mock('@/react/portainer/gitops/AuthFieldset', async (importOriginal) => ({
  ...(await importOriginal()),
  AuthFieldset: vi.fn(() => (
    <div data-testid="auth-fieldset">
      <div>Repository Authentication</div>
    </div>
  )),
}));

vi.mock(
  '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset',
  () => ({
    RelativePathFieldset: vi.fn(() => (
      <div data-testid="relative-path-fieldset">Relative Path Fieldset</div>
    )),
  })
);

vi.mock('@@/form-components/MultiRegistrySelectFieldset', () => ({
  MultiRegistrySelectFieldset: vi.fn(
    ({
      options,
    }: {
      options: Array<{ Id: number; Name: string }>;
      value: number[];
    }) => (
      <div data-testid="multi-registry-select">
        {options?.map((registry: { Id: number; Name: string }) => (
          <span key={registry.Id}>{registry.Name}</span>
        ))}
      </div>
    )
  ),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('@/react/docker/proxy/queries/useVersion', () => ({
  useApiVersion: vi.fn(),
}));

// In test setup or beforeEach
beforeEach(() => {
  vi.mocked(useApiVersion).mockReturnValue(1.27);
});

const mockConfirmStackUpdate = vi.mocked(confirmStackUpdate);
const mockConfirmEnableTLSVerify = vi.mocked(confirmEnableTLSVerify);
const mockBaseStackWebhookUrl = vi.mocked(baseStackWebhookUrl);
const mockCreateWebhookId = vi.mocked(createWebhookId);

describe('StackRedeployGitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockConfirmStackUpdate.mockResolvedValue({ repullImageAndRedeploy: false });
    mockConfirmEnableTLSVerify.mockResolvedValue(true);
    mockBaseStackWebhookUrl.mockReturnValue(
      'http://localhost:9000/api/webhooks'
    );
    mockCreateWebhookId.mockReturnValue('test-webhook-id');

    server.use(
      http.put('/api/stacks/:id/git/redeploy', () =>
        HttpResponse.json({ success: true })
      ),
      http.post('/api/stacks/:id/git', () =>
        HttpResponse.json({ success: true })
      )
    );
  });

  describe('Basic rendering', () => {
    it('should render the form with correct sections', () => {
      renderComponent();

      expect(
        screen.getByText('Redeploy from git repository')
      ).toBeInTheDocument();

      expect(screen.getByText('Options')).toBeInTheDocument(); // available only when apiVersion is >= 1.27
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display repository information in InfoPanel', () => {
      renderComponent();

      expect(
        screen.getByText('https://github.com/test/repo')
      ).toBeInTheDocument();
      expect(screen.getByText('docker-compose.yml')).toBeInTheDocument();
    });

    it('should show advanced configuration toggle button', () => {
      renderComponent();

      expect(screen.getByText('Advanced configuration')).toBeInTheDocument();
      expect(
        screen.getByTestId('advanced-configuration-toggle-button')
      ).toBeInTheDocument();
    });

    it('should show Pull and redeploy button', () => {
      renderComponent();

      expect(screen.getByText('Pull and redeploy')).toBeInTheDocument();
      expect(screen.getByTestId('stack-redeploy-button')).toBeInTheDocument();
    });

    it('should show Save settings button', () => {
      renderComponent();

      expect(screen.getByText('Save settings')).toBeInTheDocument();
      expect(
        screen.getByTestId('stack-save-settings-button')
      ).toBeInTheDocument();
    });
  });

  describe('Advanced configuration toggle', () => {
    it('should show advanced configuration when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      expect(screen.getByText('Hide configuration')).toBeInTheDocument();
      expect(screen.getByText('Skip TLS Verification')).toBeInTheDocument();
    });

    it('should hide advanced configuration when toggle is clicked again', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);
      await user.click(toggleButton);

      expect(screen.getByText('Advanced configuration')).toBeInTheDocument();
      expect(
        screen.queryByText('Skip TLS Verification')
      ).not.toBeInTheDocument();
    });
  });

  describe('TLS Skip Verification', () => {
    it('should show TLS skip verification switch in advanced config', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      expect(
        screen.getByTestId('gitops-skip-tls-verification-switch')
      ).toBeInTheDocument();
    });

    it('should call confirmEnableTLSVerify when enabling TLS verification', async () => {
      const user = userEvent.setup();
      const propsWithTLSDisabled: DeepPartial<StackRedeployGitFormProps> = {
        stack: {
          GitConfig: {
            TLSSkipVerify: true,
          },
        },
      };

      renderComponent(propsWithTLSDisabled);

      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      expect(mockConfirmEnableTLSVerify).toHaveBeenCalled();
    });
  });

  describe('Options section', () => {
    it('should show prune services option for swarm stacks with API version >= 1.27', () => {
      vi.mocked(useApiVersion).mockReturnValue(1.27);
      renderComponent();

      expect(screen.getByText('Prune services')).toBeInTheDocument();
      expect(
        screen.getByTestId('stack-prune-services-switch')
      ).toBeInTheDocument();
    });

    it('should not show options section for non-swarm stacks', () => {
      vi.mocked(useApiVersion).mockReturnValue(1.27);

      renderComponent({
        stack: {
          Type: 2,
        },
      });

      expect(screen.queryByText('Options')).not.toBeInTheDocument();
    });

    it('should not show options section for older API versions', () => {
      vi.mocked(useApiVersion).mockReturnValue(1.26);
      renderComponent();

      expect(screen.queryByText('Options')).not.toBeInTheDocument();
    });
  });

  describe('Pull and redeploy functionality', () => {
    it('should call confirmStackUpdate when redeploy button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const redeployButton = screen.getByTestId('stack-redeploy-button');
      await user.click(redeployButton);

      expect(mockConfirmStackUpdate).toHaveBeenCalledWith(
        'Any changes to this stack or application made locally in Portainer will be overridden, which may cause service interruption. Do you wish to continue?',
        true
      );
    });

    it('should call updateGitStack mutation when confirmed', async () => {
      let requestBody: unknown = null;
      server.use(
        http.put('/api/stacks/:id/git/redeploy', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const user = userEvent.setup();
      renderComponent();

      const redeployButton = screen.getByTestId('stack-redeploy-button');
      await user.click(redeployButton);

      await waitFor(() => {
        expect(requestBody).toEqual(
          expect.objectContaining({
            prune: false,
            RepositoryReferenceName: 'refs/heads/main',
          })
        );
      });
    });

    it('should notify success on successful redeploy', async () => {
      server.use(
        http.put('/api/stacks/:id/git/redeploy', async () =>
          HttpResponse.json({ success: true })
        )
      );

      const user = userEvent.setup();

      renderComponent();

      const redeployButton = screen.getByTestId('stack-redeploy-button');
      await user.click(redeployButton);

      await waitFor(() => {
        expect(notifySuccess).toHaveBeenCalled();
      });
    });

    it('should disable redeploy button when in progress', async () => {
      const user = userEvent.setup();
      server.use(
        http.put('/api/stacks/:id/git/redeploy', async () => {
          // never resolve
          await new Promise(() => {});
          return HttpResponse.json({ success: true });
        })
      );
      renderComponent();

      const redeployButton = screen.getByTestId('stack-redeploy-button');
      await user.click(redeployButton);

      // The button should be disabled during the redeploy process
      await waitFor(() => {
        expect(redeployButton).toBeDisabled();
      });
    });
  });

  describe('Save settings functionality', () => {
    it('should call updateGitStackSettings mutation when save button is clicked', async () => {
      let requestBody: unknown;
      server.use(
        http.post('/api/stacks/:id/git', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const user = userEvent.setup();

      renderComponent();

      // Make a change to enable the save button
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      const saveButton = screen.getByTestId('stack-save-settings-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(requestBody).toEqual(
          expect.objectContaining({
            RepositoryReferenceName: 'refs/heads/main',
            prune: false,
            TLSSkipVerify: true,
          })
        );
      });
    });

    it('should disable save button when no changes are made', () => {
      renderComponent();

      const saveButton = screen.getByTestId('stack-save-settings-button');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Make a change to enable the save button
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      const saveButton = screen.getByTestId('stack-save-settings-button');
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button when in progress', () => {
      server.use(
        http.post('/api/stacks/:id/git', async () => {
          // never resolve
          await new Promise(() => {});
          return HttpResponse.json({ success: true });
        })
      );
      renderComponent();

      const saveButton = screen.getByTestId('stack-save-settings-button');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Form state management', () => {
    it('should track unsaved changes correctly', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Initially no unsaved changes
      const saveButton = screen.getByTestId('stack-save-settings-button');
      expect(saveButton).toBeDisabled();

      // Make a change
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      // Should now have unsaved changes
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should clear unsaved changes after successful save', async () => {
      const user = userEvent.setup();
      server.use(
        http.put('/api/stacks/:id/git/redeploy', async () =>
          HttpResponse.json({ success: true })
        )
      );
      renderComponent();

      // Make a change
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      // Save the changes
      const saveButton = screen.getByTestId('stack-save-settings-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Error handling', () => {
    // Suppress console logs for error handling tests
    const restoreConsole = suppressConsoleLogs();
    afterAll(restoreConsole);

    it('should handle updateGitStack mutation errors gracefully', async () => {
      const user = userEvent.setup();
      server.use(
        http.put('/api/stacks/:id/git/redeploy', async () =>
          HttpResponse.json({ error: 'Update failed' }, { status: 400 })
        )
      );

      renderComponent();

      const redeployButton = screen.getByTestId('stack-redeploy-button');
      await user.click(redeployButton);

      await waitFor(() => {
        expect(notifyError).toHaveBeenCalled();
      });
    });

    it('should handle updateGitStackSettings mutation errors gracefully', async () => {
      const user = userEvent.setup();
      server.use(
        http.post('/api/stacks/:id/git', async () =>
          HttpResponse.json({ error: 'Update failed' }, { status: 400 })
        )
      );

      renderComponent();

      // Make a change to enable save button
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      const saveButton = screen.getByTestId('stack-save-settings-button');
      await user.click(saveButton);

      // Should not clear unsaved changes on error
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });
    });
  });

  describe('Git authentication', () => {
    it('should handle git authentication configuration', async () => {
      const user = userEvent.setup();
      const propsWithAuth: DeepPartial<StackRedeployGitFormProps> = {
        stack: {
          GitConfig: {
            Authentication: {
              Username: 'testuser',
              Password: 'testpass',
              GitCredentialID: 0,
            },
          },
        },
      };
      renderComponent(propsWithAuth);

      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      // Should show authentication fields
      expect(screen.getByText('Repository Authentication')).toBeInTheDocument();
    });
  });

  describe('Webhook configuration', () => {
    it('should generate webhook ID when no webhook is provided and use it in save settings', async () => {
      let requestBody: unknown;
      server.use(
        http.post('/api/stacks/:id/git', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );
      const user = userEvent.setup();
      mockCreateWebhookId.mockReturnValue('generated-webhook-id');

      renderComponent({
        stack: {
          AutoUpdate: {
            Webhook: '',
          },
        },
      });

      expect(mockCreateWebhookId).toHaveBeenCalled();

      // Make a change to enable save button
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      const saveButton = screen.getByTestId('stack-save-settings-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(requestBody).toEqual(
          expect.objectContaining({
            AutoUpdate: expect.objectContaining({
              Webhook: 'generated-webhook-id',
            }),
          })
        );
      });
    });

    it('should use existing webhook ID from stack without generating new one', async () => {
      const user = userEvent.setup();
      let requestBody: unknown;
      server.use(
        http.post('/api/stacks/:id/git', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      renderComponent({
        stack: {
          AutoUpdate: {
            Webhook: 'existing-webhook-id',
          },
        },
      });

      expect(mockCreateWebhookId).not.toHaveBeenCalled();

      // Make a change to enable save button
      const toggleButton = screen.getByTestId(
        'advanced-configuration-toggle-button'
      );
      await user.click(toggleButton);

      const tlsSwitch = screen.getByTestId(
        'gitops-skip-tls-verification-switch'
      );
      await user.click(tlsSwitch);

      const saveButton = screen.getByTestId('stack-save-settings-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(requestBody).toEqual(
          expect.objectContaining({
            AutoUpdate: expect.objectContaining({
              Webhook: 'existing-webhook-id',
            }),
          })
        );
      });
    });
  });
});

const defaultProps: StackRedeployGitFormProps = {
  stack: {
    GitConfig: {
      URL: 'https://github.com/test/repo',
      ReferenceName: 'refs/heads/main',
      ConfigFilePath: 'docker-compose.yml',
      ConfigHash: 'abc123',
      TLSSkipVerify: false,
    },
    Name: 'stack',

    Id: 1,
    EndpointId: 1,
    Type: 1, // Swarm stack
    Env: [
      { name: 'ENV1', value: 'value1' },
      { name: 'ENV2', value: 'value2' },
    ],
    Option: {
      Prune: false,
      Force: false,
    },
    AdditionalFiles: ['file1.yml', 'file2.yml'],
    AutoUpdate: {
      Interval: '5m',
      Webhook: 'test-webhook-id',
      ForceUpdate: false,
      ForcePullImage: false,
    },
  } as Stack,
};

function renderComponent(props: DeepPartial<StackRedeployGitFormProps> = {}) {
  const Component = withTestQueryProvider(
    withUserProvider(withTestRouter(StackRedeployGitForm))
  );
  // merge deep the props
  return render(<Component {..._.merge({}, defaultProps, props)} />);
}
