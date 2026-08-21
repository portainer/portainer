import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { EnvironmentGroup } from '../../types';

import { AccessTab } from './AccessTab';

vi.mock('@/react/hooks/useIdParam', () => ({
  useIdParam: () => 2,
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

const mockGroup: EnvironmentGroup = {
  Id: 2,
  Name: 'Test Group',
  Description: '',
  TagIds: [],
};

function setupMocks({
  group = mockGroup,
  users = [] as Array<{ Id: number; Username: string; Role: number }>,
  teams = [] as Array<{ Id: number; Name: string }>,
  onUpdate = vi.fn(),
  holdUpdate,
}: {
  group?: EnvironmentGroup;
  users?: Array<{ Id: number; Username: string; Role: number }>;
  teams?: Array<{ Id: number; Name: string }>;
  onUpdate?: (body: unknown) => void;
  holdUpdate?: Promise<void>;
} = {}) {
  server.use(
    http.get('/api/endpoint_groups/2', () => HttpResponse.json(group)),
    http.get('/api/users', () => HttpResponse.json(users)),
    http.get('/api/teams', () => HttpResponse.json(teams)),
    http.put('/api/endpoint_groups/2', async ({ request }) => {
      onUpdate(await request.json());
      await holdUpdate;
      return HttpResponse.json(group);
    })
  );

  return onUpdate;
}

function renderAccessTab() {
  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(AccessTab))
  );
  return render(<Wrapped />);
}

describe('AccessTab', () => {
  test('shows the authorized users and teams, and hides the rest', async () => {
    setupMocks({
      group: {
        ...mockGroup,
        UserAccessPolicies: { 5: { RoleId: 3 } },
        TeamAccessPolicies: { 3: { RoleId: 3 } },
      },
      users: [
        { Id: 5, Username: 'authorized-user', Role: 2 },
        { Id: 6, Username: 'other-user', Role: 2 },
      ],
      teams: [
        { Id: 3, Name: 'authorized-team' },
        { Id: 4, Name: 'other-team' },
      ],
    });
    renderAccessTab();

    await waitFor(() => {
      expect(screen.getByText('authorized-user')).toBeVisible();
    });
    expect(screen.getByText('authorized-team')).toBeVisible();
    expect(screen.queryByText('other-user')).not.toBeInTheDocument();
    expect(screen.queryByText('other-team')).not.toBeInTheDocument();
  });

  test('assigns a selected user to the group', async () => {
    const onUpdate = setupMocks({
      group: { ...mockGroup, TeamAccessPolicies: { 3: { RoleId: 3 } } },
      users: [{ Id: 6, Username: 'new-user', Role: 2 }],
      teams: [{ Id: 3, Name: 'authorized-team' }],
    });
    renderAccessTab();

    const selector = await screen.findByLabelText(
      'Select user(s) and/or team(s)'
    );
    await userEvent.click(selector);
    await userEvent.click(await screen.findByText('new-user'));
    await userEvent.click(
      screen.getByRole('button', { name: /Create access/ })
    );

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        UserAccessPolicies: { 6: { RoleId: 3 } },
        TeamAccessPolicies: { 3: { RoleId: 3 } },
      });
    });

    // the selector only clears once the mutation succeeds
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Remove new-user' })
      ).not.toBeInTheDocument();
    });
  });

  test('creating access leaves the remove button idle', async () => {
    // never resolves, so the create request stays in flight while we assert
    setupMocks({
      group: { ...mockGroup, UserAccessPolicies: { 5: { RoleId: 3 } } },
      users: [
        { Id: 5, Username: 'authorized-user', Role: 2 },
        { Id: 6, Username: 'new-user', Role: 2 },
      ],
      holdUpdate: new Promise<void>(() => {}),
    });
    renderAccessTab();

    const selector = await screen.findByLabelText(
      'Select user(s) and/or team(s)'
    );
    await userEvent.click(selector);
    await userEvent.click(await screen.findByText('new-user'));
    await userEvent.click(
      screen.getByRole('button', { name: /Create access/ })
    );

    await screen.findByText('Creating access...');
    expect(screen.queryByText('Removing...')).not.toBeInTheDocument();
  });

  test('keeps the selection when creating access fails', async () => {
    const restoreConsole = suppressConsoleLogs();
    setupMocks({ users: [{ Id: 6, Username: 'new-user', Role: 2 }] });
    server.use(
      http.put(
        '/api/endpoint_groups/2',
        () => new HttpResponse(null, { status: 500 })
      )
    );
    renderAccessTab();

    const selector = await screen.findByLabelText(
      'Select user(s) and/or team(s)'
    );
    await userEvent.click(selector);
    await userEvent.click(await screen.findByText('new-user'));
    await userEvent.click(
      screen.getByRole('button', { name: /Create access/ })
    );

    // once the request settles the selection is still there to retry with
    await waitFor(() => {
      expect(screen.queryByText('Creating access...')).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'Remove new-user' })
    ).toBeVisible();
    restoreConsole();
  });
});
