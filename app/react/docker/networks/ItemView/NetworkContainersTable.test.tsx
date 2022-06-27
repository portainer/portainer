import { renderWithQueryClient } from '@/react-tools/test-utils';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { NetworkContainer } from '../types';

import { NetworkContainersTable } from './NetworkContainersTable';

const networkContainers: NetworkContainer[] = [
  {
    EndpointID:
      '069d703f3ff4939956233137c4c6270d7d46c04fb10c44d3ec31fde1b46d6610',
    IPv4Address: '10.0.1.3/24',
    IPv6Address: '',
    MacAddress: '02:42:0a:00:01:03',
    Name: 'portainer-agent_agent.8hjjodl4hoyhuq1kscmzccyqn.wnv2pp17f8ayeopke2z56yw5x',
    Id: 'd54c74b7e1c5649d2a880d3fc02c6201d1d2f85a4fee718f978ec8b147239295',
  },
];

jest.mock('@uirouter/react', () => ({
  ...jest.requireActual('@uirouter/react'),
  useCurrentStateAndParams: jest.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

test('Network container values should be visible and the link should be valid', async () => {
  const user = new UserViewModel({ Username: 'test', Role: 1 });
  const { findByText } = renderWithQueryClient(
    <UserContext.Provider value={{ user }}>
      <NetworkContainersTable
        networkContainers={networkContainers}
        nodeName=""
        environmentId={1}
        networkId="pc8xc9s6ot043vl1q5iz4zhfs"
      />
    </UserContext.Provider>
  );

  await expect(findByText('Containers in network')).resolves.toBeVisible();
  await expect(findByText(networkContainers[0].Name)).resolves.toBeVisible();
  await expect(
    findByText(networkContainers[0].IPv4Address)
  ).resolves.toBeVisible();
  await expect(
    findByText(networkContainers[0].MacAddress)
  ).resolves.toBeVisible();
  await expect(
    findByText('Leave network', { exact: false })
  ).resolves.toBeVisible();
});
