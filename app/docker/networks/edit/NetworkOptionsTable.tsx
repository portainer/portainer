import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { DetailsTable } from '@/portainer/components/DetailsTable';

import { NetworkOptions } from '../types';

type Props = {
  options: NetworkOptions;
};

export function NetworkOptionsTable({ options }: Props) {
  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <Widget>
          <WidgetTitle title="Network options" icon="fa-cogs" />
          <WidgetBody className="nopadding">
            <DetailsTable>
              {Object.entries(options).map(([key, value]) => (
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
