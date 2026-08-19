import { render } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';
import { PageTitle } from './PageTitle';

test('should display the page title via PageTitle and the user menu via HeaderTitle', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });

  const title = 'title';

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <>
          <HeaderContainer>
            <HeaderTitle />
          </HeaderContainer>
          <PageTitle title={title} />
        </>
      )),
      user
    )
  );

  const { queryByText } = render(<Wrapped />);

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
