import { render } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';

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

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

test('Network container values should be visible and the link should be valid', async () => {
  server.use(http.get('/api/endpoints/1', () => HttpResponse.json({})));

  const user = new UserViewModel({ Username: 'test', Role: 1 });

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(NetworkContainersTable), user)
  );

  const { findByText } = render(
    <Wrapped
      networkContainers={networkContainers}
      nodeName=""
      environmentId={1}
      networkId="pc8xc9s6ot043vl1q5iz4zhfs"
    />
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
