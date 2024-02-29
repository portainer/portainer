import { QueryClient, QueryClientProvider } from 'react-query';

import { UserContext } from '@/react/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render } from '@/react-tools/test-utils';

import { PageHeader } from './PageHeader';

test('should display a PageHeader', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });
  const queryClient = new QueryClient();

  const title = 'title';

  const { queryByText } = render(
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ user }}>
        <PageHeader title={title} />
      </UserContext.Provider>
    </QueryClientProvider>
  );

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
