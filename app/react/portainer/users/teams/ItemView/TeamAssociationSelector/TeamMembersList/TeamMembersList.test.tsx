import { render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { UserViewModel } from '@/portainer/models/user';
import { Role, User } from '@/portainer/users/types';
import { createMockUser } from '@/react-tools/test-mocks';
import { TeamRole } from '@/react/portainer/users/teams/types';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';

import { TeamMembersList } from './TeamMembersList';

const teamId = 3;
const leader = createMockUser({
  Id: 5,
  Username: 'leader',
  Role: Role.Standard,
});
const member = createMockUser({
  Id: 6,
  Username: 'member',
  Role: Role.Standard,
});
const roles = { [leader.Id]: TeamRole.Leader, [member.Id]: TeamRole.Member };

beforeEach(() => {
  server.use(
    http.get(`/api/teams/${teamId}/memberships`, () => HttpResponse.json([]))
  );
});

test('renders correctly', () => {
  const queries = renderComponent(new UserViewModel({ Username: 'user' }), []);

  expect(queries).toBeTruthy();
});

test('a team leader cannot remove themselves, only the other members', async () => {
  renderComponent(new UserViewModel(leader), [leader, member]);

  expect(await screen.findByText('member')).toBeVisible();
  expect(screen.getByTestId('remove-member-member')).toBeVisible();
  expect(screen.queryByTestId('remove-member-leader')).not.toBeInTheDocument();
});

test('an administrator can remove anyone, leaders included', async () => {
  renderComponent(
    new UserViewModel({ Id: 1, Username: 'admin', Role: Role.Admin }),
    [leader, member]
  );

  expect(await screen.findByTestId('remove-member-leader')).toBeVisible();
  expect(screen.getByTestId('remove-member-member')).toBeVisible();
});

function renderComponent(user: UserViewModel, users: Array<User>) {
  const Wrapped = withTestQueryProvider(
    withUserProvider(TeamMembersList, user)
  );

  return render(<Wrapped users={users} roles={roles} teamId={teamId} />);
}

test.todo('when users list is empty, add all users button is disabled');
test.todo('filter displays expected users');
