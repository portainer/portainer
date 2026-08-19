import { PropsWithChildren } from 'react';

import { WidgetBody } from '@@/Widget';
import { Widget } from '@@/Widget/Widget';

export function SortableListCard({ children }: PropsWithChildren<unknown>) {
  return (
    <Widget className="th-dark:!border-gray-8">
      <WidgetBody className="overflow-hidden !p-0">{children}</WidgetBody>
    </Widget>
  );
}
