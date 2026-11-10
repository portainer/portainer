import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import { Role, User } from '@/portainer/users/types';

import { ListView } from './ListView';

vi.mock('@@/PageHeader', () => ({
  PageHeader: () => null,
}));

vi.mock('./NewUserForm/NewUserForm', () => ({
  NewUserForm: () => <div>Add a new user</div>,
}));

vi.mock('./UsersDatatable/UsersDatatable', () => ({
  UsersDatatable: () => <div>Users table</div>,
}));

it('offers the create-user form to an administrator', () => {
  renderView(new UserViewModel({ Id: 1, Username: 'admin', Role: Role.Admin }));

  expect(screen.getByText('Add a new user')).toBeVisible();
  expect(screen.getByText('Users table')).toBeVisible();
});

it('leaves the create-user form out for a team leader, who cannot create users', () => {
  renderView(
    new UserViewModel({ Id: 5, Username: 'leader', Role: Role.Standard })
  );

  expect(screen.queryByText('Add a new user')).not.toBeInTheDocument();
  expect(screen.getByText('Users table')).toBeVisible();
});

function renderView(user: User) {
  const Wrapped = withUserProvider(() => <ListView />, user);

  return render(<Wrapped />);
}
