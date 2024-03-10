import { render } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { UsersList } from './UsersList';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withTestQueryProvider(withUserProvider(UsersList, user));

  return render(<Wrapped users={[]} teamId={3} />);
}

test.todo('when users list is empty, add all users button is disabled');
test.todo('filter displays expected users');
