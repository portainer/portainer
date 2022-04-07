import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render } from '@/react-tools/test-utils';

import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';

test('should not render without a wrapping HeaderContainer', async () => {
  const consoleErrorFn = jest
    .spyOn(console, 'error')
    .mockImplementation(() => jest.fn());

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

  const title = 'title';
  const { queryByText } = render(
    <UserContext.Provider value={{ user }}>
      <HeaderContainer>
        <HeaderTitle title={title} />
      </HeaderContainer>
    </UserContext.Provider>
  );

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
