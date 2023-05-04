import { PropsWithChildren } from 'react';

import { Widget, WidgetBody } from '@@/Widget';

interface Props {
  // workaround to remove the widget, ideally we should have a different component to wrap the table with a widget
  noWidget?: boolean;
}

export function TableContainer({
  children,
  noWidget = false,
}: PropsWithChildren<Props>) {
  if (noWidget) {
    return <div className="datatable">{children}</div>;
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <div className="datatable">
          <Widget>
            <WidgetBody className="no-padding">{children}</WidgetBody>
          </Widget>
        </div>
      </div>
    </div>
  );
}
