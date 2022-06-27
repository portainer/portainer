import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';

import { NetworkOptions } from '../types';

type Props = {
  options: NetworkOptions;
};

export function NetworkOptionsTable({ options }: Props) {
  const networkEntries = Object.entries(options);

  if (networkEntries.length === 0) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <WidgetTitle title="Network options" icon="fa-cogs" />
          <WidgetBody className="nopadding">
            <DetailsTable dataCy="networkDetails-networkOptionsTable">
              {networkEntries.map(([key, value]) => (
                <DetailsTable.Row key={key} label={key}>
                  {value}
                </DetailsTable.Row>
              ))}
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
