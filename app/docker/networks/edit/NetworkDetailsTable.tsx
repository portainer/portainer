import { Fragment } from 'react';
import DockerNetworkHelper from 'Docker/helpers/networkHelper';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { DetailsTable } from '@/portainer/components/DetailsTable';
import { Button } from '@/portainer/components/Button';
import { Authorized } from '@/portainer/hooks/useUser';

import { isSystemNetwork } from '../network.helper';
import { DockerNetwork, IPConfig } from '../types';

interface Props {
  network: DockerNetwork;
  onRemoveNetworkClicked: () => void;
}

export function NetworkDetailsTable({
  network,
  onRemoveNetworkClicked,
}: Props) {
  const allowRemoveNetwork = !isSystemNetwork(network.Name);
  const IPV4Configs: IPConfig[] =
    (network.IPAM && DockerNetworkHelper.getIPV4Configs(network.IPAM.Config)) ||
    [];
  const IPV6Configs: IPConfig[] =
    (network.IPAM && DockerNetworkHelper.getIPV6Configs(network.IPAM.Config)) ||
    [];

  return (
    <div className="col-lg-12 col-md-12 col-xs-12">
      <Widget>
        <WidgetTitle title="Network details" icon="fa-sitemap" />
        <WidgetBody className="nopadding">
          <DetailsTable>
            {/* networkRowContent */}
            <DetailsTable.Row label="Name">{network.Name}</DetailsTable.Row>
            <DetailsTable.Row label="Id">
              {network.Id}
              {allowRemoveNetwork && (
                <Authorized authorizations="DockerNetworkDelete">
                  <Button
                    dataCy="networkDetails-deleteNetwork"
                    size="xsmall"
                    color="danger"
                    onClick={() => onRemoveNetworkClicked()}
                  >
                    <i
                      className="fa fa-trash-alt space-right"
                      aria-hidden="true"
                    />
                    Delete this network
                  </Button>
                </Authorized>
              )}
            </DetailsTable.Row>
            <DetailsTable.Row label="Driver">{network.Driver}</DetailsTable.Row>
            <DetailsTable.Row label="Scope">{network.Scope}</DetailsTable.Row>
            <DetailsTable.Row label="Attachable">
              {String(network.Attachable)}
            </DetailsTable.Row>
            <DetailsTable.Row label="Internal">
              {String(network.Internal)}
            </DetailsTable.Row>

            {/* IPV4 ConfigRowContent */}
            {IPV4Configs &&
              IPV4Configs?.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsTable.Row
                    label={`IPV4 Subnet${getConfigDetails(config.Subnet)}`}
                  >
                    {`IPV4 Gateway${getConfigDetails(config.Gateway)}`}
                  </DetailsTable.Row>
                  <DetailsTable.Row
                    label={`IPV4 IP Range${getConfigDetails(config.IPRange)}`}
                  >
                    {`IPV4 Excluded IPs - ${Object.values(
                      config.AuxiliaryAddresses || []
                    ).join(' - ')}`}
                  </DetailsTable.Row>
                </Fragment>
              ))}

            {/* IPV6 ConfigRowContent */}
            {IPV6Configs &&
              IPV6Configs?.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsTable.Row
                    label={`IPV6 Subnet${getConfigDetails(config.Subnet)}`}
                  >
                    {`IPV6 Gateway${getConfigDetails(config.Gateway)}`}
                  </DetailsTable.Row>
                  <DetailsTable.Row
                    label={`IPV6 IP Range${getConfigDetails(config.IPRange)}`}
                  >
                    {`IPV6 Excluded IPs - ${Object.values(
                      config.AuxiliaryAddresses || []
                    ).join(' - ')}`}
                  </DetailsTable.Row>
                </Fragment>
              ))}
          </DetailsTable>
        </WidgetBody>
      </Widget>
    </div>
  );

  function getConfigDetails(configValue: string | undefined) {
    return configValue ? ` - ${configValue}` : '';
  }
}
