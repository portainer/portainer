import { Fragment } from 'react';
import { Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import DockerNetworkHelper from '@/docker/helpers/networkHelper';
import { Authorized } from '@/react/hooks/useUser';

import { TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';
import { DeleteButton } from '@@/buttons/DeleteButton';

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
  const { t } = useTranslation();
  const allowRemoveNetwork = !isSystemNetwork(network.Name);
  const ipv4Configs: IPConfig[] = DockerNetworkHelper.getIPV4Configs(
    network.IPAM?.Config
  );
  const ipv6Configs: IPConfig[] = DockerNetworkHelper.getIPV6Configs(
    network.IPAM?.Config
  );

  return (
    <TableContainer>
      <TableTitle label={t('docker_networks.detail_title')} icon={Network} />
      <DetailsTable dataCy="networkDetails-detailsTable">
        {/* networkRowContent */}
        <DetailsTable.Row label={t('docker_networks.name_label')}>{network.Name}</DetailsTable.Row>
        <DetailsTable.Row label={t('docker_networks.id_label')}>
          {network.Id}
          {allowRemoveNetwork && (
            <span className="ml-2">
              <Authorized authorizations="DockerNetworkDelete">
                <DeleteButton
                  data-cy="networkDetails-deleteNetwork"
                  size="xsmall"
                  onConfirmed={onRemoveNetworkClicked}
                  confirmMessage={t('docker_networks.delete_confirm')}
                >
                  {t('docker_networks.delete_button')}
                </DeleteButton>
              </Authorized>
            </span>
          )}
        </DetailsTable.Row>
        <DetailsTable.Row label={t('docker_networks.driver_label')}>{network.Driver}</DetailsTable.Row>
        <DetailsTable.Row label={t('docker_networks.scope_label')}>{network.Scope}</DetailsTable.Row>
        <DetailsTable.Row label={t('docker_networks.attachable_label')}>
          {String(network.Attachable)}
        </DetailsTable.Row>
        <DetailsTable.Row label={t('docker_networks.internal_label')}>
          {String(network.Internal)}
        </DetailsTable.Row>

        {/* IPV4 ConfigRowContent */}
        {ipv4Configs.map((config) => (
          <Fragment key={config.Subnet}>
            <DetailsTable.Row
              label={`${t('docker_networks.ipv4_subnet')}${getConfigDetails(config.Subnet)}`}
            >
              {`${t('docker_networks.ipv4_gateway')}${getConfigDetails(config.Gateway)}`}
            </DetailsTable.Row>
            <DetailsTable.Row
              label={`${t('docker_networks.ipv4_ip_range')}${getConfigDetails(config.IPRange)}`}
            >
              {`${t('docker_networks.ipv4_excluded_ips')}${getAuxiliaryAddresses(
                config.AuxiliaryAddresses
              )}`}
            </DetailsTable.Row>
          </Fragment>
        ))}

        {/* IPV6 ConfigRowContent */}
        {ipv6Configs.map((config) => (
          <Fragment key={config.Subnet}>
            <DetailsTable.Row
              label={`${t('docker_networks.ipv6_subnet')}${getConfigDetails(config.Subnet)}`}
            >
              {`${t('docker_networks.ipv6_gateway')}${getConfigDetails(config.Gateway)}`}
            </DetailsTable.Row>
            <DetailsTable.Row
              label={`${t('docker_networks.ipv6_ip_range')}${getConfigDetails(config.IPRange)}`}
            >
              {`${t('docker_networks.ipv6_excluded_ips')}${getAuxiliaryAddresses(
                config.AuxiliaryAddresses
              )}`}
            </DetailsTable.Row>
          </Fragment>
        ))}
      </DetailsTable>
    </TableContainer>
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
