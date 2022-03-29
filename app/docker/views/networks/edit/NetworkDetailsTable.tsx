import { Fragment } from 'react';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { Button } from '@/portainer/components/Button';
import { Authorized } from '@/portainer/hooks/useUser';

import { NetworkRowContent, IPConfigs } from '../types';

interface Props {
  networkRowContent: NetworkRowContent | undefined;
  allowRemove: boolean;
  IPV4Configs: IPConfigs;
  IPV6Configs: IPConfigs;
  onRemoveNetworkClicked: () => void;
}

export function NetworkDetailsTable({
  networkRowContent,
  allowRemove,
  IPV4Configs,
  IPV6Configs,
  onRemoveNetworkClicked,
}: Props) {
  // convert the networkRowContent to table rows
  function renderNetworkRowContent() {
    if (networkRowContent && networkRowContent.length > 0) {
      return networkRowContent.map(([key, value]) => (
        <tr key={key}>
          <td>{key}</td>
          <td data-cy={`networkDetails-${key}Value`}>
            {key !== 'Id' && value}
            {key === 'Id' && (
              <>
                {value}
                {allowRemove && (
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
          </td>
        </tr>
      ));
    }
    return null;
  }

  function renderIPConfigRowContent(IPConfigs: IPConfigs, IPType: string) {
    if (IPConfigs && IPConfigs.length > 0) {
      // subnet, gateways, iprange
      return IPConfigs.map((config) => (
        <Fragment key={config.Subnet}>
          <tr>
            <td data-cy={`networkDetails-${IPType}Subnet`}>{`${IPType} Subnet${
              config.Subnet ? ` - ${config.Subnet}` : ''
            }`}</td>
            <td
              data-cy={`networkDetails-${IPType}Gateway`}
            >{`${IPType} Gateway${
              config.Gateway ? ` - ${config.Gateway}` : ''
            }`}</td>
          </tr>
          <tr>
            <td
              data-cy={`networkDetails-${IPType}IPRange`}
            >{`${IPType} IP Range${
              config.IPRange ? ` - ${config.IPRange}` : ''
            }`}</td>
            <td data-cy={`networkDetails-${IPType}ExcludedIPs`}>
              {`${IPType} Excluded IPs`}
              {config.AuxiliaryAddresses &&
                config.AuxiliaryAddresses.map((auxAddress) => (
                  <span key={auxAddress}>{` - ${auxAddress}`}</span>
                ))}
            </td>
          </tr>
        </Fragment>
      ));
    }
    return null;
  }

  return (
    <div className="col-lg-12 col-md-12 col-xs-12">
      <Widget>
        <WidgetTitle title="Network details" icon="fa-sitemap" />
        <WidgetBody className="nopadding">
          <table className="table">
            <tbody>
              {renderNetworkRowContent()}
              {renderIPConfigRowContent(IPV4Configs, 'IPV4')}
              {renderIPConfigRowContent(IPV6Configs, 'IPV6')}
            </tbody>
          </table>
        </WidgetBody>
      </Widget>
    </div>
  );
}
