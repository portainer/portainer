import { Fragment } from 'react';
import DockerNetworkHelper from 'Docker/helpers/networkHelper';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import {
  DetailsTable,
  DetailsTableKeyValueRow,
} from '@/portainer/components/DetailsTable';
import { Button } from '@/portainer/components/Button';
import { Authorized } from '@/portainer/hooks/useUser';

import { isSystemNetwork } from '../network.helper';
import { DockerNetwork, IPConfig } from '../types';

interface Props {
  network: DockerNetwork;
  onRemoveNetworkClicked: () => void;
}

type NetworkKey =
  | 'Name'
  | 'Id'
  | 'Scope'
  | 'Driver'
  | 'Attachable'
  | 'Internal';

type NetworkRowContent = [NetworkKey, string][];

const filteredNetworkKeys: NetworkKey[] = [
  'Name',
  'Id',
  'Driver',
  'Scope',
  'Attachable',
  'Internal',
];

export function NetworkDetailsTable({
  network,
  onRemoveNetworkClicked,
}: Props) {
  const networkRowContent: NetworkRowContent = filteredNetworkKeys.map(
    (key) => [key, String(network[key])]
  );
  const allowRemoveNetwork = !isSystemNetwork(network.Name);
  const IPV4Configs: IPConfig[] | undefined =
    network.IPAM && DockerNetworkHelper.getIPV4Configs(network.IPAM.Config);
  const IPV6Configs: IPConfig[] | undefined =
    network.IPAM && DockerNetworkHelper.getIPV6Configs(network.IPAM.Config);

  return (
    <div className="col-lg-12 col-md-12 col-xs-12">
      <Widget>
        <WidgetTitle title="Network details" icon="fa-sitemap" />
        <WidgetBody className="nopadding">
          <DetailsTable>
            {/* networkRowContent */}
            {networkRowContent &&
              networkRowContent?.map(([key, value]) => (
                <DetailsTableKeyValueRow key={key} keyProp={key}>
                  {key !== 'Id' && value}
                  {key === 'Id' && (
                    <>
                      {value}
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
                    </>
                  )}
                </DetailsTableKeyValueRow>
              ))}

            {/* IPV4 ConfigRowContent */}
            {IPV4Configs &&
              IPV4Configs?.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsTableKeyValueRow
                    keyProp={`IPV4 Subnet${
                      config.Subnet ? ` - ${config.Subnet}` : ''
                    }`}
                  >
                    {`IPV4 Gateway${
                      config.Gateway ? ` - ${config.Gateway}` : ''
                    }`}
                  </DetailsTableKeyValueRow>
                  <DetailsTableKeyValueRow
                    keyProp={`IPV4 IP Range${
                      config.IPRange ? ` - ${config.IPRange}` : ''
                    }`}
                  >
                    <div>{`IPV4 Excluded IPs `}</div>
                    {config.AuxiliaryAddresses &&
                      Object.values(config.AuxiliaryAddresses).map(
                        (auxAddress) => <li key={auxAddress}>{auxAddress}</li>
                      )}
                  </DetailsTableKeyValueRow>
                </Fragment>
              ))}

            {/* IPV6 ConfigRowContent */}
            {IPV6Configs &&
              IPV6Configs?.map((config) => (
                <Fragment key={config.Subnet}>
                  <DetailsTableKeyValueRow
                    keyProp={`IPV6 Subnet${
                      config.Subnet ? ` - ${config.Subnet}` : ''
                    }`}
                  >
                    {`IPV6 Gateway${
                      config.Gateway ? ` - ${config.Gateway}` : ''
                    }`}
                  </DetailsTableKeyValueRow>
                  <DetailsTableKeyValueRow
                    keyProp={`IPV6 IP Range${
                      config.IPRange ? ` - ${config.IPRange}` : ''
                    }`}
                  >
                    <div>{`IPV6 Excluded IPs `}</div>
                    {config.AuxiliaryAddresses &&
                      Object.values(config.AuxiliaryAddresses).map(
                        (auxAddress) => (
                          <li key={auxAddress}>{`- ${auxAddress}`}</li>
                        )
                      )}
                  </DetailsTableKeyValueRow>
                </Fragment>
              ))}
          </DetailsTable>
        </WidgetBody>
      </Widget>
    </div>
  );
}
