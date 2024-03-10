import { render } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { PageHeader } from './PageHeader';

test('should display a PageHeader', async () => {
  const username = 'username';
  const user = new UserViewModel({ Username: username });

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(PageHeader), user)
  );

  const title = 'title';
  const { queryByText } = render(<Wrapped title={title} />);

  const heading = queryByText(title);
  expect(heading).toBeVisible();

  expect(queryByText(username)).toBeVisible();
});
