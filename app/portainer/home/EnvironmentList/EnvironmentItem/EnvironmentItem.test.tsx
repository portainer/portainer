import { render } from '@/react-tools/test-utils';
import '@testing-library/jest-dom';

import { EnvironmentItem } from './EnvironmentItem';

test('loads component', async () => {
  const env = {
    TagIds: [],
    GroupId: 1,
    GroupName: 'unassigned',
    Type: 1,
    Name: 'environment',
    Status: 1,
    URL: 'url',
    Snapshots: [],
    Kubernetes: { Snapshots: [] },
    Id: 3,
  };
  const { getByText } = render(
    <EnvironmentItem
      onClick={() => {}}
      tags={[]}
      environment={env}
      isAdmin
      homepageLoadTime={0}
    />
  );

  expect(getByText(env.Name)).toBeInTheDocument();
});
