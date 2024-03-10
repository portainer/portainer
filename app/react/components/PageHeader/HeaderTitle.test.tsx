import { render } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';

test('should not render without a wrapping HeaderContainer', async () => {
  const consoleErrorFn = vi
    .spyOn(console, 'error')
    .mockImplementation(() => vi.fn());

  const title = 'title';
  function renderComponent() {
    const Wrapped = withTestQueryProvider(HeaderTitle);
    return render(<Wrapped title={title} />);
  }

  expect(renderComponent).toThrowErrorMatchingSnapshot();

  consoleErrorFn.mockRestore();
});

test('should display a HeaderTitle', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });

  const title = 'title';

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <HeaderContainer>
          <HeaderTitle title={title} />
        </HeaderContainer>
      )),
      user
    )
  );

  const { queryByText } = render(<Wrapped />);

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
