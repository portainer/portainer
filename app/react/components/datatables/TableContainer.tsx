import { PropsWithChildren } from 'react';

import { Widget, WidgetBody } from '@@/Widget';

export function TableContainer({ children }: PropsWithChildren<unknown>) {
  return (
    <div className="datatable">
      <Widget>
        <WidgetBody className="no-padding">{children}</WidgetBody>
      </Widget>
    </div>
  );
}
