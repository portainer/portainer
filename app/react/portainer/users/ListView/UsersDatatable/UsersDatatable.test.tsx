import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import { Role } from '@/portainer/users/types';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import { AuthenticationMethod } from '@/react/portainer/settings/types';

import { TeamRole } from '../../teams/types';

import { UsersDatatable } from './UsersDatatable';

vi.mock('@@/Link', () => ({
  Link: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

const leader = { Id: 5, Username: 'leader', Role: Role.Standard };
const member = { Id: 6, Username: 'member', Role: Role.Standard };
const loner = { Id: 7, Username: 'loner', Role: Role.Standard };

const leaderMembership = {
  Id: 1,
  UserID: leader.Id,
  TeamID: 1,
  Role: TeamRole.Leader,
};
const memberMembership = {
  Id: 2,
  UserID: member.Id,
  TeamID: 1,
  Role: TeamRole.Member,
};

beforeEach(() => {
  server.use(
    http.get('/api/settings/public', () =>
      HttpResponse.json({ AuthenticationMethod: AuthenticationMethod.LDAP })
    ),
    http.get('/api/settings', () =>
      HttpResponse.json({ message: 'Access denied' }, { status: 403 })
    )
  );
});

it('lists the users a team leader can see, without the admin-only settings', async () => {
  server.use(
    http.get('/api/users', () => HttpResponse.json([leader, member])),
    http.get('/api/users/:id/memberships', () =>
      HttpResponse.json([leaderMembership])
    ),
    http.get('/api/team_memberships', () =>
      HttpResponse.json([leaderMembership, memberMembership])
    )
  );

  renderTable(new UserViewModel(leader));

  expect(await screen.findByText('member')).toBeVisible();
  expect(screen.getByText('leader')).toBeVisible();
  expect(screen.getAllByText('LDAP')).toHaveLength(2);
});

it('does not ask for every membership when the user leads no team', async () => {
  const restoreConsole = suppressConsoleLogs();
  let listedMemberships = false;
  const onQueryError = vi.fn();
  server.use(
    http.get('/api/users', () =>
      HttpResponse.json({ message: 'Access denied' }, { status: 403 })
    ),
    http.get('/api/users/:id/memberships', () => HttpResponse.json([])),
    http.get('/api/team_memberships', () => {
      listedMemberships = true;
      return HttpResponse.json({ message: 'Access denied' }, { status: 403 });
    })
  );

  renderTable(new UserViewModel(loner), onQueryError);

  await waitFor(() => expect(onQueryError).toHaveBeenCalled());
  expect(listedMemberships).toBe(false);

  restoreConsole();
});

function renderTable(
  user: UserViewModel,
  onQueryError?: (error: unknown) => void
) {
  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => <UsersDatatable />),
      user
    ),
    { onQueryError }
  );

  return render(<Wrapped />);
}
