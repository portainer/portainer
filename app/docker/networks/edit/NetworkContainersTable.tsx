import { useSref } from '@uirouter/react';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { DetailsTable } from '@/portainer/components/DetailsTable';
import { Button } from '@/portainer/components/Button';
import { Authorized } from '@/portainer/hooks/useUser';
import { EnvironmentId } from '@/portainer/environments/types';

import { NetworkContainers, NetworkId } from '../types';
import { useDisconnectContainer } from '../queries';

type Props = {
  containers: NetworkContainers;
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
  containers,
  nodeName,
  environmentId,
  networkId,
}: Props) {
  const disconnectContainer = useDisconnectContainer(environmentId, networkId);
  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <WidgetTitle title="Containers in network" icon="fa-server" />
          <WidgetBody className="nopadding">
            <DetailsTable headers={tableHeaders}>
              {Object.entries(containers).map(([containerId, container]) => (
                <tr key={containerId}>
                  <td>
                    <ContainerLink
                      containerName={container.Name}
                      containerId={containerId}
                      nodeName={nodeName}
                    />
                  </td>
                  <td>{container.IPv4Address || '-'}</td>
                  <td>{container.IPv6Address || '-'}</td>
                  <td>{container.MacAddress || '-'}</td>
                  <td>
                    <Authorized authorizations="DockerNetworkDisconnect">
                      <Button
                        dataCy="networkDetails-deleteNetwork"
                        size="xsmall"
                        color="danger"
                        onClick={() =>
                          disconnectContainer.mutate({ containerId })
                        }
                      >
                        <i
                          className="fa fa-trash-alt space-right"
                          aria-hidden="true"
                        />
                        Leave Network
                      </Button>
                    </Authorized>
                  </td>
                </tr>
              ))}
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}

function ContainerLink({
  containerName,
  containerId,
  nodeName,
}: {
  containerName: string;
  containerId: string;
  nodeName: string;
}) {
  const linkProps = useSref('docker.containers.container', {
    id: containerId,
    nodeName,
  });
  return (
    <a href={linkProps.href} onClick={linkProps.onClick}>
      {containerName}
    </a>
  );
}
