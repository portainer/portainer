import { QueryClient, QueryClientProvider } from 'react-query';

import { UserContext } from '@/react/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render } from '@/react-tools/test-utils';

import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';

test('should not render without a wrapping HeaderContainer', async () => {
  const consoleErrorFn = vi
    .spyOn(console, 'error')
    .mockImplementation(() => vi.fn());

  const title = 'title';
  function renderComponent() {
    return render(<HeaderTitle title={title} />);
  }

  expect(renderComponent).toThrowErrorMatchingSnapshot();

  consoleErrorFn.mockRestore();
});

test('should display a HeaderTitle', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });
  const queryClient = new QueryClient();

  const title = 'title';
  const { queryByText } = render(
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ user }}>
        <HeaderContainer>
          <HeaderTitle title={title} />
        </HeaderContainer>
      </UserContext.Provider>
    </QueryClientProvider>
  );

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
