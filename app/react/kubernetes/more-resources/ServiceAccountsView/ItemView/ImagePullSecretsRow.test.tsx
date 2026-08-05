import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { ReactNode } from 'react';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { useAuthorizations } from '@/react/hooks/useUser';

import { ImagePullSecretsRow } from './ImagePullSecretsRow';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => ({
    ...(await importOriginal()),
    useAuthorizations: vi.fn(),
    useCurrentUser: () => ({ isPureAdmin: false }),
  })
);

vi.mock('@/react/kubernetes/configs/queries/useSecrets', () => ({
  useSecrets: () => ({
    data: [
      { metadata: { name: 'secret-a' } },
      { metadata: { name: 'secret-b' } },
    ],
    isLoading: false,
  }),
}));

vi.mock(
  '@/react/portainer/environments/queries/useEnvironmentRegistries',
  () => ({
    useEnvironmentRegistries: () => ({
      data: {
        linkedDefaultSecretNames: [],
        registryBySecretName: {},
      },
      isLoading: false,
    }),
  })
);

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@@/Tip/Tooltip', () => ({ Tooltip: () => null }));

vi.mock('@@/Tip/TooltipWithChildren', () => ({
  TooltipWithChildren: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@@/form-components/PortainerSelect', () => ({
  MultiSelect: () => <div data-testid="multi-select" />,
}));

const ImagePullSecretsRowWithQuery = withTestQueryProvider(ImagePullSecretsRow);

type RowProps = React.ComponentProps<typeof ImagePullSecretsRow>;

function renderRow(props: Partial<RowProps> = {}) {
  return render(
    <table>
      <tbody>
        <ImagePullSecretsRowWithQuery
          namespace="default"
          name="my-sa"
          imagePullSecrets={[]}
          isSystem={false}
          {...props}
        />
      </tbody>
    </table>
  );
}

describe('ImagePullSecretsRow', () => {
  beforeEach(() => {
    vi.mocked(useAuthorizations).mockImplementation(() => ({
      authorized: false,
      isLoading: false,
    }));
  });

  describe('empty state messages', () => {
    it('shows a pod-specific message for a non-default service account', () => {
      renderRow({ name: 'my-sa', imagePullSecrets: [] });
      expect(
        screen.getByText(/Pods using this service account must specify/)
      ).toBeVisible();
    });

    it('shows a namespace-wide message for the default service account', () => {
      renderRow({ name: 'default', imagePullSecrets: [] });
      expect(
        screen.getByText(
          /Pods in this namespace without an explicit service account/
        )
      ).toBeVisible();
    });
  });

  describe('pull secret badges', () => {
    it('renders current pull secrets as badges', () => {
      renderRow({
        imagePullSecrets: [{ name: 'secret-a' }, { name: 'secret-b' }],
      });
      expect(screen.getByText('secret-a')).toBeVisible();
      expect(screen.getByText('secret-b')).toBeVisible();
    });

    it('shows a warning badge for a pull secret that no longer exists in the namespace', () => {
      renderRow({ imagePullSecrets: [{ name: 'orphan-secret' }] });
      expect(screen.getByText('orphan-secret')).toBeVisible();
    });
  });

  describe('edit button visibility by role', () => {
    it('does not show edit button for a user without write permission', () => {
      vi.mocked(useAuthorizations).mockImplementation(() => ({
        authorized: false,
        isLoading: false,
      }));
      renderRow();
      expect(
        screen.queryByRole('button', { name: /edit/i })
      ).not.toBeInTheDocument();
    });

    it('does not show edit button for system service accounts, even for an admin', () => {
      vi.mocked(useAuthorizations).mockImplementation(() => ({
        authorized: true,
        isLoading: false,
      }));
      renderRow({ isSystem: true });
      expect(
        screen.queryByRole('button', { name: /edit/i })
      ).not.toBeInTheDocument();
    });

    it('shows edit button for an authorized user on a non-system SA', () => {
      vi.mocked(useAuthorizations).mockImplementation((permission) => ({
        authorized: permission === 'K8sServiceAccountsW',
        isLoading: false,
      }));
      renderRow({ isSystem: false });
      expect(screen.getByRole('button', { name: /edit/i })).toBeVisible();
    });
  });

  describe('edit flow', () => {
    beforeEach(() => {
      vi.mocked(useAuthorizations).mockImplementation((permission) => ({
        authorized: permission === 'K8sServiceAccountsW',
        isLoading: false,
      }));
    });

    it('shows save and cancel buttons after clicking edit', async () => {
      renderRow({ imagePullSecrets: [{ name: 'secret-a' }] });

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));

      expect(screen.getByRole('button', { name: /save/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
    });

    it('returns to view mode when cancel is clicked', async () => {
      renderRow({ imagePullSecrets: [{ name: 'secret-a' }] });

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.getByRole('button', { name: /edit/i })).toBeVisible();
      expect(
        screen.queryByRole('button', { name: /save/i })
      ).not.toBeInTheDocument();
    });

    it('sends a PUT to the correct path and body when save is clicked', async () => {
      let capturedPath: string | undefined;
      let capturedBody: unknown;

      server.use(
        http.put(
          '/api/kubernetes/:envId/namespaces/:namespace/service_accounts/:name/image_pull_secrets',
          async ({ request }) => {
            capturedPath = request.url;
            capturedBody = await request.json();
            return new HttpResponse(null, { status: 204 });
          }
        )
      );

      renderRow({
        namespace: 'production',
        name: 'app-sa',
        imagePullSecrets: [{ name: 'secret-a' }, { name: 'secret-b' }],
      });

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedPath).toContain(
          '/api/kubernetes/1/namespaces/production/service_accounts/app-sa/image_pull_secrets'
        );
        expect(capturedBody).toEqual({
          secretNames: ['secret-a', 'secret-b'],
        });
      });
    });

    it('sends an empty secretNames array when there are no pull secrets', async () => {
      let capturedBody: unknown;

      server.use(
        http.put(
          '/api/kubernetes/:envId/namespaces/:namespace/service_accounts/:name/image_pull_secrets',
          async ({ request }) => {
            capturedBody = await request.json();
            return new HttpResponse(null, { status: 204 });
          }
        )
      );

      renderRow({ namespace: 'default', name: 'my-sa', imagePullSecrets: [] });

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedBody).toEqual({ secretNames: [] });
      });
    });
  });

  describe('admin vs standard user role', () => {
    it('admin with registry access can enter edit mode', async () => {
      vi.mocked(useAuthorizations).mockImplementation(() => ({
        authorized: true,
        isLoading: false,
      }));
      renderRow({ isSystem: false });
      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      expect(screen.getByRole('button', { name: /save/i })).toBeVisible();
    });

    it('standard user with write permission but no registry access can also enter edit mode', async () => {
      vi.mocked(useAuthorizations).mockImplementation((permission) => ({
        authorized: permission === 'K8sServiceAccountsW',
        isLoading: false,
      }));
      renderRow({ isSystem: false });
      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      expect(screen.getByRole('button', { name: /save/i })).toBeVisible();
    });
  });
});
