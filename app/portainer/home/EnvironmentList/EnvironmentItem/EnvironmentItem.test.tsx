import {
  EnvironmentGroup,
  EnvironmentGroupId,
} from '@/portainer/environment-groups/types';
import { Environment } from '@/portainer/environments/types';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';
import { Tag } from '@/portainer/tags/types';
import { renderWithQueryClient } from '@/react-tools/test-utils';
import { server, rest } from '@/setup-tests/server';

import { EnvironmentItem } from './EnvironmentItem';

test('loads component', async () => {
  const env: Environment = {
    TagIds: [],
    GroupId: 1,
    Type: 1,
    Name: 'environment',
    Status: 1,
    URL: 'url',
    Snapshots: [],
    Kubernetes: { Snapshots: [] },
    Id: 3,
    UserTrusted: false,
  };
  const { getByText } = renderComponent(env);

  expect(getByText(env.Name)).toBeInTheDocument();
});

test('shows group name', async () => {
  const groupName = 'group-name';
  const groupId: EnvironmentGroupId = 14;

  const env: Environment = {
    TagIds: [],
    GroupId: groupId,
    Type: 1,
    Name: 'environment',
    Status: 1,
    URL: 'url',
    Snapshots: [],
    Kubernetes: { Snapshots: [] },
    Id: 3,
    UserTrusted: false,
  };

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

  server.use(rest.get('/api/tags', (req, res, ctx) => res(ctx.json(tags))));

  return renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <EnvironmentItem
        onClick={() => {}}
        environment={env}
        groupName={group.Name}
      />
    </UserContext.Provider>
  );
}
