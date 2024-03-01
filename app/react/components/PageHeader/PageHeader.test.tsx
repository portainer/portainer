import { UserContext } from '@/react/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { renderWithQueryClient } from '@/react-tools/test-utils';

import { PageHeader } from './PageHeader';

test('should display a PageHeader', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });

  const title = 'title';
  const { queryByText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <PageHeader title={title} />
    </UserContext.Provider>
  );

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
