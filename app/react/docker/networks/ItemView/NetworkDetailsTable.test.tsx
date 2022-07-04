import { render } from '@/react-tools/test-utils';
import { UserContext } from '@/portainer/hooks/useUser';
import { UserViewModel } from '@/portainer/models/user';

import { DockerNetwork } from '../types';

import { NetworkDetailsTable } from './NetworkDetailsTable';

jest.mock('@uirouter/react', () => ({
  ...jest.requireActual('@uirouter/react'),
  useCurrentStateAndParams: jest.fn(() => ({
    params: { endpointId: 1 },
  })),
}));

test('Network details values should be visible', async () => {
  const network = getNetwork('test');

  const { findByText } = await renderComponent(true, network);

  await expect(findByText(network.Name)).resolves.toBeVisible();
  await expect(findByText(network.Id)).resolves.toBeVisible();
  await expect(findByText(network.Driver)).resolves.toBeVisible();
  await expect(findByText(network.Scope)).resolves.toBeVisible();
  await expect(
    findByText(network.IPAM?.Config[0].Gateway || 'not found', { exact: false })
  ).resolves.toBeVisible();
  await expect(
    findByText(network.IPAM?.Config[0].Subnet || 'not found', { exact: false })
  ).resolves.toBeVisible();
});

test(`System networks shouldn't show a delete button`, async () => {
  const systemNetwork = getNetwork('bridge');
  const { queryByText } = await renderComponent(true, systemNetwork);

  const deleteButton = queryByText('Delete this network');
  expect(deleteButton).toBeNull();
});

test('Non system networks should have a delete button', async () => {
  const nonSystemNetwork = getNetwork('non system network');

  const { queryByText } = await renderComponent(true, nonSystemNetwork);

  const button = queryByText('Delete this network');
  expect(button).toBeVisible();
});

async function renderComponent(isAdmin: boolean, network: DockerNetwork) {
  const user = new UserViewModel({ Username: 'test', Role: isAdmin ? 1 : 2 });

  const queries = render(
    <UserContext.Provider value={{ user }}>
      <NetworkDetailsTable
        network={network}
        onRemoveNetworkClicked={() => {}}
      />
    </UserContext.Provider>
  );

  await expect(queries.findByText('Network details')).resolves.toBeVisible();

  return queries;
}

function getNetwork(networkName: string): DockerNetwork {
  return {
    Attachable: false,
    Containers: {
      a761fcafdae3bdae42cf3702c8554b3e1b0334f85dd6b65b3584aff7246279e4: {
        EndpointID:
          '404afa6e25cede7c0fd70180777b662249cd83e40fa9a41aa593d2bac0fc5e18',
        IPv4Address: '172.17.0.2/16',
        IPv6Address: '',
        MacAddress: '02:42:ac:11:00:02',
        Name: 'portainer',
      },
    },
    Driver: 'bridge',
    IPAM: {
      Config: [
        {
          Gateway: '172.17.0.1',
          Subnet: '172.17.0.0/16',
        },
      ],
      Driver: 'default',
      Options: null,
    },
    Id: '4c52a72e3772fdfb5823cf519b759e3f716e6d98cfb3bfef056e32c9c878329f',
    Internal: false,
    Name: networkName,
    Options: {
      'com.docker.network.bridge.default_bridge': 'true',
      'com.docker.network.bridge.enable_icc': 'true',
      'com.docker.network.bridge.enable_ip_masquerade': 'true',
      'com.docker.network.bridge.host_binding_ipv4': '0.0.0.0',
      'com.docker.network.bridge.name': 'docker0',
      'com.docker.network.driver.mtu': '1500',
    },
    Portainer: {
      ResourceControl: {
        Id: 41,
        ResourceId:
          '85d807847e4a4adb374a2a105124eda607ef584bef2eb6acf8091f3afd8446db',
        Type: 4,
        UserAccesses: [
          {
            UserId: 2,
            AccessLevel: 1,
          },
        ],
        TeamAccesses: [],
        Public: true,
        System: false,
        AdministratorsOnly: true,
      },
    },
    Scope: 'local',
  };
}
