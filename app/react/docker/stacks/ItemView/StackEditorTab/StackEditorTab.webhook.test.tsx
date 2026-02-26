import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultBodyType, http, HttpResponse } from 'msw';
import uuidv4 from 'uuid/v4';

import { server } from '@/setup-tests/server';
import { Stack } from '@/react/common/stacks/types';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { createMockStack, createMockUsers } from '@/react-tools/test-mocks';
import { Role } from '@/portainer/users/types';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { StackEditorTab } from './StackEditorTab';

vi.mock('uuid/v4', () => ({
  default: vi.fn(() => 'test-webhook-id-1234'),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

vi.mock('@/react/common/stacks/common/confirm-stack-update', () => ({
  confirmStackUpdate: vi.fn(() =>
    Promise.resolve({ repullImageAndRedeploy: false })
  ),
}));

describe('StackEditorTab - Webhook ID Handling', () => {
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

  describe('Editor stack with existing webhook', () => {
    it('should display existing webhook ID', async () => {
      const existingWebhookId = 'existing-webhook-123';

      const stack = createMockStack({
        Id: 1,
        Webhook: existingWebhookId,
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      await waitFor(() => {
        const webhookDisplay = screen.queryByRole('textbox', {
          name: /webhook url/i,
        });
        expect(webhookDisplay).toBeInTheDocument();
        expect(webhookDisplay).toHaveTextContent(existingWebhookId);
      });

      expect(vi.mocked(uuidv4)).not.toHaveBeenCalled();
    });
  });

  describe('Editor stack without webhook', () => {
    it('should not display webhook ID and should call uuid once for fallback', async () => {
      vi.clearAllMocks();

      const stack = createMockStack({
        Id: 1,
        Webhook: '',
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      const webhookDisplay = screen.queryByRole('textbox', {
        name: /webhook url/i,
      });
      expect(webhookDisplay).not.toBeInTheDocument();

      expect(vi.mocked(uuidv4)).toHaveBeenCalledOnce();
    });
  });

  describe('Form submission', () => {
    it('should send webhook ID in API request when stack has webhook', async () => {
      const restoreConsole = suppressConsoleLogs();

      const user = userEvent.setup();
      let capturedRequestBody: DefaultBodyType;

      server.use(
        http.put('/api/stacks/:id', async ({ request }) => {
          capturedRequestBody = await request.json();
          return HttpResponse.json({ Id: 1, Name: 'test-stack' });
        })
      );

      const stack = createMockStack({
        Id: 1,
        Webhook: 'existing-webhook-123',
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      const deployButton = screen.getByTestId('stack-deploy-button');
      await waitFor(() => {
        expect(deployButton).toBeEnabled();
      });

      await user.click(deployButton);

      await waitFor(
        () => {
          expect(capturedRequestBody).toBeDefined();
        },
        { timeout: 3000 }
      );

      assert(capturedRequestBody && typeof capturedRequestBody === 'object');
      expect(capturedRequestBody?.webhook).toBe('existing-webhook-123');

      restoreConsole();
    });

    it('should not send webhook ID in API request when stack has no webhook', async () => {
      const restoreConsole = suppressConsoleLogs();
      const user = userEvent.setup();
      let capturedRequestBody: DefaultBodyType;

      server.use(
        http.put('/api/stacks/:id', async ({ request }) => {
          capturedRequestBody = await request.json();
          return HttpResponse.json({ Id: 1, Name: 'test-stack' });
        })
      );

      const stack = createMockStack({
        Id: 1,
        Webhook: '',
      });

      renderComponent({ stack });

      await waitFor(() => {
        expect(screen.getByTestId('stack-deploy-button')).toBeInTheDocument();
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      const deployButton = screen.getByTestId('stack-deploy-button');
      await waitFor(() => {
        expect(deployButton).toBeEnabled();
      });

      await user.click(deployButton);

      await waitFor(
        () => {
          expect(capturedRequestBody).toBeDefined();
        },
        { timeout: 3000 }
      );

      expect(capturedRequestBody).not.toHaveProperty('webhook');
      restoreConsole();
    });
  });
});

function renderComponent({ stack }: { stack: Stack }) {
  const user = createMockUsers(1, Role.Admin)[0];

  const Component = withTestRouter(
    withUserProvider(
      withTestQueryProvider(() => (
        <StackEditorTab
          stack={stack}
          isOrphaned={false}
          originalFileContent={`services:
  web:
    image: nginx`}
        />
      )),
      user
    )
  );

  return render(<Component />);
}
