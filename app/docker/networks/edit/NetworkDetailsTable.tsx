import { Fragment } from 'react';
import DockerNetworkHelper from 'Docker/helpers/networkHelper';

import { Authorized } from '@/portainer/hooks/useUser';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';
import { Button } from '@@/buttons';

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
  const ipv4Configs: IPConfig[] = DockerNetworkHelper.getIPV4Configs(
    network.IPAM?.Config
  );
  const ipv6Configs: IPConfig[] = DockerNetworkHelper.getIPV6Configs(
    network.IPAM?.Config
  );

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <WidgetTitle title="Network details" icon="fa-sitemap" />
          <WidgetBody className="nopadding">
            <DetailsTable dataCy="networkDetails-detailsTable">
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
              <DetailsTable.Row label="Driver">
                {network.Driver}
              </DetailsTable.Row>
              <DetailsTable.Row label="Scope">{network.Scope}</DetailsTable.Row>
              <DetailsTable.Row label="Attachable">
                {String(network.Attachable)}
              </DetailsTable.Row>
              <DetailsTable.Row label="Internal">
                {String(network.Internal)}
              </DetailsTable.Row>

              {/* IPV4 ConfigRowContent */}
              {ipv4Configs.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsTable.Row
                    label={`IPV4 Subnet${getConfigDetails(config.Subnet)}`}
                  >
                    {`IPV4 Gateway${getConfigDetails(config.Gateway)}`}
                  </DetailsTable.Row>
                  <DetailsTable.Row
                    label={`IPV4 IP Range${getConfigDetails(config.IPRange)}`}
                  >
                    {`IPV4 Excluded IPs${getAuxiliaryAddresses(
                      config.AuxiliaryAddresses
                    )}`}
                  </DetailsTable.Row>
                </Fragment>
              ))}

              {/* IPV6 ConfigRowContent */}
              {ipv6Configs.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsTable.Row
                    label={`IPV6 Subnet${getConfigDetails(config.Subnet)}`}
                  >
                    {`IPV6 Gateway${getConfigDetails(config.Gateway)}`}
                  </DetailsTable.Row>
                  <DetailsTable.Row
                    label={`IPV6 IP Range${getConfigDetails(config.IPRange)}`}
                  >
                    {`IPV6 Excluded IPs${getAuxiliaryAddresses(
                      config.AuxiliaryAddresses
                    )}`}
                  </DetailsTable.Row>
                </Fragment>
              ))}
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  function getConfigDetails(configValue?: string) {
    return configValue ? ` - ${configValue}` : '';
  }

  function getAuxiliaryAddresses(auxiliaryAddresses?: object) {
    return auxiliaryAddresses
      ? ` - ${Object.values(auxiliaryAddresses).join(' - ')}`
      : '';
  }
}
