import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { Button } from '@/portainer/components/Button';
import { Authorized } from '@/portainer/hooks/useUser';

import { NetworkRowContent } from './types';

interface Props {
  networkRowContent: NetworkRowContent | undefined;
  allowRemove: boolean;
  onRemoveNetwork: () => void;
}

export function NetworkDetailsTable({
  networkRowContent,
  allowRemove,
  onRemoveNetwork,
}: Props) {
  // convert the network key value pairs into an array of {key: string, value: string} objects
  console.log(networkRowContent);

  // convert the networkRowContent to table rows
  function renderNetworkRowContentRows() {
    return networkRowContent?.map(([key, value]) => (
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
                    onClick={() => onRemoveNetwork()}
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

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <WidgetTitle title="Network details" icon="fa-sitemap" />
          <WidgetBody className="nopadding">
            <table className="table">
              <tbody>{renderNetworkRowContentRows()}</tbody>
            </table>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
