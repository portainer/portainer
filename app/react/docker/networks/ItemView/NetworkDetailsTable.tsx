import { Fragment } from 'react';

import DockerNetworkHelper from '@/docker/helpers/networkHelper';
import { Authorized } from '@/portainer/hooks/useUser';

import { Table, TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';
import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

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
        <TableContainer>
          <TableTitle label="Network details" icon="share-2" featherIcon />
          <Table className="nopadding">
            <DetailsTable dataCy="networkDetails-detailsTable">
              {/* networkRowContent */}
              <DetailsTable.Row label="Name">{network.Name}</DetailsTable.Row>
              <DetailsTable.Row label="Id">
                {network.Id}
                {allowRemoveNetwork && (
                  <Authorized authorizations="DockerNetworkDelete">
                    <Button
                      data-cy="networkDetails-deleteNetwork"
                      size="xsmall"
                      color="danger"
                      onClick={() => onRemoveNetworkClicked()}
                    >
                      <Icon
                        icon="trash-2"
                        feather
                        className="space-right"
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
          </Table>
        </TableContainer>
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
