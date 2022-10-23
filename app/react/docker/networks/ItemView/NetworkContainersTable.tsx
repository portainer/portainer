import { Authorized } from '@/portainer/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Icon } from '@/react/components/Icon';

import { Table, TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { NetworkContainer, NetworkId } from '../types';
import { useDisconnectContainer } from '../queries';

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
  const disconnectContainer = useDisconnectContainer();

  if (networkContainers.length === 0) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <TableContainer>
          <TableTitle label="Containers in network" icon="server" featherIcon />
          <Table className="nopadding">
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
                            disconnectContainer.mutate({
                              containerId: container.Id,
                              environmentId,
                              networkId,
                            });
                          }
                        }}
                      >
                        <Icon
                          icon="trash-2"
                          feather
                          class-name="icon-secondary icon-md"
                        />
                        Leave Network
                      </Button>
                    </Authorized>
                  </td>
                </tr>
              ))}
            </DetailsTable>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
