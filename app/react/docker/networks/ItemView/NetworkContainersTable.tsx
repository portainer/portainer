import { Server, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Icon } from '@/react/components/Icon';
import { notifySuccess } from '@/portainer/services/notifications';

import { TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { NetworkContainer, NetworkId } from '../types';
import { useDisconnectContainer } from '../queries/useDisconnectContainerMutation';

type Props = {
  networkContainers: NetworkContainer[];
  nodeName: string;
  environmentId: EnvironmentId;
  networkId: NetworkId;
};

const tableHeaders = [
  'Container Name',
  'IPv4 Address',
  'IPv6 Address',
  'MacAddress',
  'Actions',
];

export function NetworkContainersTable({
  networkContainers,
  nodeName,
  environmentId,
  networkId,
}: Props) {
  const disconnectContainer = useDisconnectContainer({
    environmentId,
    networkId,
  });

  if (networkContainers.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <TableTitle label="Containers in network" icon={Server} />
      <DetailsTable
        headers={tableHeaders}
        dataCy="networkDetails-networkContainers"
      >
        {networkContainers.map((container) => (
          <tr key={container.Id}>
            <td>
              <Link
                to="docker.containers.container"
                params={{
                  id: container.Id,
                  nodeName,
                }}
                title={container.Name}
                data-cy={`networkDetails-containerName-${container.Name}`}
              >
                {container.Name}
              </Link>
            </td>
            <td>{container.IPv4Address || '-'}</td>
            <td>{container.IPv6Address || '-'}</td>
            <td>{container.MacAddress || '-'}</td>
            <td>
              <Authorized authorizations="DockerNetworkDisconnect">
                <Button
                  data-cy={`networkDetails-disconnect${container.Name}`}
                  size="xsmall"
                  color="dangerlight"
                  onClick={() => {
                    if (container.Id) {
                      disconnectContainer.mutate(
                        {
                          containerId: container.Id,
                          nodeName,
                        },
                        {
                          onSuccess: () =>
                            notifySuccess(
                              'Container successfully disconnected',
                              networkId
                            ),
                        }
                      );
                    }
                  }}
                >
                  <Icon icon={Trash2} class-name="icon-secondary icon-md" />
                  Leave Network
                </Button>
              </Authorized>
            </td>
          </tr>
        ))}
      </DetailsTable>
    </TableContainer>
  );
}
