import { Fragment } from 'react';
import DockerNetworkHelper from 'Docker/helpers/networkHelper';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { DetailsTable, DetailsRow } from '@/portainer/components/DetailsTable';
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
            <DetailsRow keyProp="Name">{network.Name}</DetailsRow>
            <DetailsRow keyProp="Id">
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
            </DetailsRow>
            <DetailsRow keyProp="Driver">{network.Driver}</DetailsRow>
            <DetailsRow keyProp="Scope">{network.Scope}</DetailsRow>
            <DetailsRow keyProp="Attachable">
              {String(network.Attachable)}
            </DetailsRow>
            <DetailsRow keyProp="Internal">
              {String(network.Internal)}
            </DetailsRow>

            {/* IPV4 ConfigRowContent */}
            {IPV4Configs &&
              IPV4Configs?.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsRow
                    keyProp={`IPV4 Subnet${getConfigDetails(config.Subnet)}`}
                  >
                    {`IPV4 Gateway${getConfigDetails(config.Gateway)}`}
                  </DetailsRow>
                  <DetailsRow
                    keyProp={`IPV4 IP Range${getConfigDetails(config.IPRange)}`}
                  >
                    {`IPV4 Excluded IPs - ${Object.values(
                      config.AuxiliaryAddresses || []
                    ).join(' - ')}`}
                  </DetailsRow>
                </Fragment>
              ))}

            {/* IPV6 ConfigRowContent */}
            {IPV6Configs &&
              IPV6Configs?.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsRow
                    keyProp={`IPV6 Subnet${getConfigDetails(config.Subnet)}`}
                  >
                    {`IPV6 Gateway${getConfigDetails(config.Gateway)}`}
                  </DetailsRow>
                  <DetailsRow
                    keyProp={`IPV6 IP Range${getConfigDetails(config.IPRange)}`}
                  >
                    {`IPV6 Excluded IPs - ${Object.values(
                      config.AuxiliaryAddresses || []
                    ).join(' - ')}`}
                  </DetailsRow>
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
