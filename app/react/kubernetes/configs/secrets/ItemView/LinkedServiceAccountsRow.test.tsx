import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { ReactNode } from 'react';
import { vi } from 'vitest';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { useAuthorizations } from '@/react/hooks/useUser';
import { useGetAllServiceAccountsQuery } from '@/react/kubernetes/more-resources/ServiceAccountsView/ServiceAccountsDatatable/queries/useGetAllServiceAccountsQuery';

import { LinkedServiceAccountsRow } from './LinkedServiceAccountsRow';

vi.mock(
  '@/react/hooks/useUser',
  async (importOriginal: () => Promise<object>) => ({
    ...(await importOriginal()),
    useAuthorizations: vi.fn(),
  })
);

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock(
  '@/react/kubernetes/more-resources/ServiceAccountsView/ServiceAccountsDatatable/queries/useGetAllServiceAccountsQuery'
);

vi.mock(
  '@/react/kubernetes/configs/secrets/queries/useSecretsLinkedToDefaultSA',
  () => ({
    useSecretsLinkedToDefaultSA: () => ({ data: [], isLoading: false }),
  })
);

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@@/Tip/Tooltip', () => ({ Tooltip: () => null }));

vi.mock('@@/Tip/TooltipWithChildren', () => ({
  TooltipWithChildren: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

// Captures the latest onChange so tests can programmatically drive selection
let latestOnChange: ((v: string[]) => void) | undefined;
vi.mock('@@/form-components/PortainerSelect', () => ({
  MultiSelect: ({ onChange }: { onChange: (v: string[]) => void }) => {
    latestOnChange = onChange;
    return <div data-testid="multi-select" />;
  },
}));

const LinkedServiceAccountsRowWithQuery = withTestQueryProvider(
  LinkedServiceAccountsRow
);

type RowProps = React.ComponentProps<typeof LinkedServiceAccountsRow>;

function renderRow(props: Partial<RowProps> = {}) {
  return render(
    <table>
      <tbody>
        <LinkedServiceAccountsRowWithQuery
          secretName="my-secret"
          namespace="default"
          isSystem={false}
          {...props}
        />
      </tbody>
    </table>
  );
}

describe('LinkedServiceAccountsRow', () => {
  beforeEach(() => {
    latestOnChange = undefined;
    vi.mocked(useAuthorizations).mockImplementation(() => ({
      authorized: false,
      isLoading: false,
    }));
    vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);
  });

  describe('loading state', () => {
    it('shows a loading indicator while service accounts are being fetched', () => {
      vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);
      renderRow();
      expect(screen.getByText(/loading service accounts/i)).toBeVisible();
    });
  });

  describe('empty state', () => {
    it('shows guidance text when no service accounts are linked to the secret', () => {
      renderRow();
      expect(screen.getByText(/No service accounts linked/)).toBeVisible();
    });
  });

  describe('linked service account badges', () => {
    it('shows a badge for each service account that references this secret', () => {
      vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
        data: [
          {
            name: 'app-sa',
            namespace: 'default',
            imagePullSecrets: [{ name: 'my-secret' }],
          },
          {
            name: 'other-sa',
            namespace: 'default',
            imagePullSecrets: [{ name: 'my-secret' }],
          },
        ],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);
      renderRow({ secretName: 'my-secret' });
      expect(screen.getByText('app-sa')).toBeVisible();
      expect(screen.getByText('other-sa')).toBeVisible();
    });

    it('only shows service accounts from the matching namespace', () => {
      vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
        data: [
          {
            name: 'in-namespace-sa',
            namespace: 'default',
            imagePullSecrets: [{ name: 'my-secret' }],
          },
          {
            name: 'other-namespace-sa',
            namespace: 'staging',
            imagePullSecrets: [{ name: 'my-secret' }],
          },
        ],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);
      renderRow({ namespace: 'default' });
      expect(screen.getByText('in-namespace-sa')).toBeVisible();
      expect(screen.queryByText('other-namespace-sa')).not.toBeInTheDocument();
    });

    it('shows a "+N more" badge when there are more than 5 linked SAs', () => {
      vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
        data: Array.from({ length: 7 }, (_, i) => ({
          name: `sa-${i}`,
          namespace: 'default',
          imagePullSecrets: [{ name: 'my-secret' }],
        })),
        isLoading: false,
      } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);
      renderRow();
      expect(screen.getByText(/\+ 2 more/)).toBeVisible();
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

    it('does not show edit button for system secrets, even for an admin', () => {
      vi.mocked(useAuthorizations).mockImplementation(() => ({
        authorized: true,
        isLoading: false,
      }));
      renderRow({ isSystem: true });
      expect(
        screen.queryByRole('button', { name: /edit/i })
      ).not.toBeInTheDocument();
    });

    it('shows edit button for an authorized user on a non-system secret', () => {
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

    it('shows save and cancel buttons when editing', async () => {
      renderRow();
      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      expect(screen.getByRole('button', { name: /save/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
    });

    it('returns to view mode when cancel is clicked', async () => {
      renderRow();
      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.getByRole('button', { name: /edit/i })).toBeVisible();
      expect(
        screen.queryByRole('button', { name: /save/i })
      ).not.toBeInTheDocument();
    });

    it('sends a PUT to the correct path and body when linking a new service account', async () => {
      vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
        data: [{ name: 'app-sa', namespace: 'default', imagePullSecrets: [] }],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);

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

      renderRow({ secretName: 'my-secret', namespace: 'default' });

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      await act(async () => {
        latestOnChange!(['app-sa']);
      });
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedPath).toContain(
          '/api/kubernetes/1/namespaces/default/service_accounts/app-sa/image_pull_secrets'
        );
        expect(capturedBody).toEqual({ secretNames: ['my-secret'] });
      });
    });

    it('sends a PUT preserving remaining secrets when removing the secret from a linked SA', async () => {
      vi.mocked(useGetAllServiceAccountsQuery).mockReturnValue({
        data: [
          {
            name: 'app-sa',
            namespace: 'default',
            imagePullSecrets: [{ name: 'my-secret' }, { name: 'other-secret' }],
          },
        ],
        isLoading: false,
      } as unknown as ReturnType<typeof useGetAllServiceAccountsQuery>);

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

      renderRow({ secretName: 'my-secret', namespace: 'default' });

      await userEvent.click(screen.getByRole('button', { name: /edit/i }));
      await act(async () => {
        latestOnChange!([]);
      });
      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(capturedBody).toEqual({ secretNames: ['other-secret'] });
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

    it('standard user with write permission but no registry access can also edit', async () => {
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
