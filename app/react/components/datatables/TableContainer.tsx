import { PropsWithChildren } from 'react';

import { Widget, WidgetBody } from '@@/Widget';

interface Props {
  // workaround to remove the widget, ideally we should have a different component to wrap the table with a widget
  noWidget?: boolean;
  'aria-label'?: string;
}

export function TableContainer({
  children,
  noWidget = false,
  'aria-label': ariaLabel,
}: PropsWithChildren<Props>) {
  if (noWidget) {
    return (
      <section className="datatable" aria-label={ariaLabel}>
        {children}
      </section>
    );
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <div className="datatable">
          <Widget aria-label={ariaLabel}>
            <WidgetBody className="no-padding">{children}</WidgetBody>
          </Widget>
        </div>
      </div>
    </div>
  );
}
