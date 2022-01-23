import { PropsWithChildren } from 'react';
import { Row, TableInstance } from 'react-table';

interface Props {
  row: Row<TableInstance>;
}

export function ExpandingCell({ children, row }: PropsWithChildren<Props>) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...row.getToggleRowExpandedProps()}>
      <i
        className={`fas ${arrowClass(row.isExpanded)} space-right`}
        aria-hidden="true"
      />
      {children}
    </div>
  );

  function arrowClass(isExpanded: boolean) {
    if (isExpanded) {
      return 'fa-angle-down';
    }
    return 'fa-angle-right';
  }
}
