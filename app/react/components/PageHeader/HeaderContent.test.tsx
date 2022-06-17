import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { render } from '@/react-tools/test-utils';

import { HeaderContainer } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';

test('should not render without a wrapping HeaderContainer', async () => {
  const consoleErrorFn = jest
    .spyOn(console, 'error')
    .mockImplementation(() => jest.fn());

  function renderComponent() {
    return render(<HeaderContent />);
  }

  expect(renderComponent).toThrowErrorMatchingSnapshot();

  consoleErrorFn.mockRestore();
});

test('should display a HeaderContent', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });
  const userProviderState = { user };
  const content = 'content';

  const { queryByText } = render(
    <UserContext.Provider value={userProviderState}>
      <HeaderContainer>
        <HeaderContent>{content}</HeaderContent>
      </HeaderContainer>
    </UserContext.Provider>
  );

  const contentElement = queryByText(content);
  expect(contentElement).toBeVisible();

  expect(queryByText('my account')).toBeVisible();
  expect(queryByText('log out')).toBeVisible();
});
