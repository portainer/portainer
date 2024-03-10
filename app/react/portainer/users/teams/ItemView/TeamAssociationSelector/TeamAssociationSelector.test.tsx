import { render } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { TeamAssociationSelector } from './TeamAssociationSelector';

test('renders correctly', () => {
  const queries = renderComponent();

  expect(queries).toBeTruthy();
});

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  const Wrapped = withTestQueryProvider(
    withUserProvider(TeamAssociationSelector, user)
  );

  return render(<Wrapped users={[]} memberships={[]} teamId={3} />);
}
