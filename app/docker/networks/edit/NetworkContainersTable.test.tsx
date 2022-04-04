import { render } from '@/react-tools/test-utils';

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

test('Network container values should be visible and the link should be valid', async () => {
  const { findByText, getByText } = render(
    <NetworkContainersTable
      networkContainers={networkContainers}
      nodeName=""
      environmentId={1}
      networkId="pc8xc9s6ot043vl1q5iz4zhfs"
    />
  );

  await expect(findByText('Containers in network')).resolves.toBeVisible();
  expect(getByText(networkContainers[0].Name).closest('a')).toHaveAttribute(
    'href',
    getHref(networkContainers[0].Id || '', '')
  );
  await expect(findByText(networkContainers[0].Name)).resolves.toBeVisible();
  await expect(
    findByText(networkContainers[0].IPv4Address)
  ).resolves.toBeVisible();
  await expect(
    findByText(networkContainers[0].MacAddress)
  ).resolves.toBeVisible();
  await expect(findByText('Leave network')).resolves.toBeVisible();
});

function getHref(containerId: string, nodeName?: string) {
  let href = `#!/2/docker/containers/${containerId}`;
  if (nodeName) {
    href += `?nodeName=${nodeName}`;
  }
  return href;
}
