import {
  EnvironmentGroup,
  EnvironmentGroupId,
} from '@/portainer/environment-groups/types';
import { Environment } from '@/portainer/environments/types';
import { render } from '@/react-tools/test-utils';
import '@testing-library/jest-dom';

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
  const { getByText } = render(
    <EnvironmentItem
      onClick={() => {}}
      tags={[]}
      groups={[]}
      environment={env}
      isAdmin
      homepageLoadTime={0}
    />
  );

  expect(getByText(env.Name)).toBeInTheDocument();
});

test('shows group name', () => {
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

  const group: EnvironmentGroup = {
    Description: '',
    Name: groupName,
    Id: groupId,
    TagIds: [],
  };

  const { getByText } = render(
    <EnvironmentItem
      onClick={() => {}}
      tags={[]}
      groups={[group]}
      environment={env}
      isAdmin
      homepageLoadTime={0}
    />
  );

  expect(getByText(groupName, { exact: false })).toBeVisible();
});
