import { http, HttpResponse } from 'msw';
import { render } from '@testing-library/react';

import {
  EnvironmentGroupId,
  Environment,
} from '@/react/portainer/environments/types';
import { UserViewModel } from '@/portainer/models/user';
import { Tag } from '@/portainer/tags/types';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { server } from '@/setup-tests/server';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';

import { EnvironmentItem } from './EnvironmentItem';

test('loads component', async () => {
  const env = createMockEnvironment();
  const { getByText } = renderComponent(env);

  expect(getByText(env.Name)).toBeInTheDocument();
});

test('shows group name', async () => {
  const groupName = 'group-name';
  const groupId: EnvironmentGroupId = 14;

  const env = createMockEnvironment();
  env.GroupId = groupId;

  const { findByText } = renderComponent(env, { Name: groupName });

  await expect(findByText(groupName)).resolves.toBeVisible();
});

function renderComponent(
  env: Environment,
  group: Partial<EnvironmentGroup> = { Name: 'group' },
  isAdmin = false,
  tags: Tag[] = []
) {
  const user = new UserViewModel({ Username: 'test', Role: isAdmin ? 1 : 2 });

  server.use(http.get('/api/tags', () => HttpResponse.json(tags)));

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EnvironmentItem, user))
  );

  return render(
    <Wrapped
      isActive={false}
      onClickBrowse={() => {}}
      onClickDisconnect={() => {}}
      environment={env}
      groupName={group.Name}
    />
  );
}
