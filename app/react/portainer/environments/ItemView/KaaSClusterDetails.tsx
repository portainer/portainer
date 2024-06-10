import KubeIcon from '@/assets/ico/kube.svg?c';

import { Widget } from '@@/Widget';
import { Button } from '@@/buttons';

import { CloudProviderSettings } from '../types';

export function KaaSClusterDetails({ info }: { info: CloudProviderSettings }) {
  return (
    <Widget>
      <Widget.Title icon={KubeIcon} title="KaaS cluster details" />

      <Widget.Body className="!p-0">
        <table className="table">
          <tbody>
            <tr>
              <td>Provider</td>
              <td>
                {info.Name}

                <span className="ml-2">
                  <Button
                    as="a"
                    size="xsmall"
                    props={{
                      href: info.URL,
                      target: '_blank',
                      rel: 'noreferrer',
                    }}
                    className="ml-2"
                    data-cy="go-to-portal"
                  >
                    Go to portal
                  </Button>
                </span>
              </td>
            </tr>
            {!!info.Region && (
              <tr>
                <td>Region</td>
                <td>{info.Region}</td>
              </tr>
            )}
            {!!info.Size && (
              <tr>
                <td> Node Size</td>
                <td>{info.Size}</td>
              </tr>
            )}
            {!!info.NetworkID && (
              <tr>
                <td>Network Id</td>
                <td>{info.NetworkID}</td>
              </tr>
            )}
            {!!info.NodeIPs && (
              <tr>
                <td>Node IPs</td>
                <td>{info.NodeIPs}</td>
              </tr>
            )}
          </tbody>
        </table>
      </Widget.Body>
    </Widget>
  );
}
