import { PropsWithChildren } from 'react';

import { Widget, WidgetBody } from '@@/Widget';

interface Props {
  // workaround to remove the widget, ideally we should have a different component to wrap the table with a widget
  noWidget?: boolean;
  'aria-label'?: string;
  id?: string;
}

export function TableContainer({
  children,
  noWidget = false,
  'aria-label': ariaLabel,
  id,
}: PropsWithChildren<Props>) {
  if (noWidget) {
    return (
      <section className="datatable" aria-label={ariaLabel}>
        {children}
      </section>
    );
  }

  return (
    <div className="datatable mx-4">
      <Widget aria-label={ariaLabel} id={id}>
        <WidgetBody className="no-padding">{children}</WidgetBody>
      </Widget>
    </div>
  );
}
