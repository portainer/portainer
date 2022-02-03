import { PropsWithChildren } from 'react';
import { Row, TableInstance } from 'react-table';

interface Props {
  row: Row<TableInstance>;
  showExpandArrow: boolean;
}

export function ExpandingCell({
  row,
  showExpandArrow,
  children,
}: PropsWithChildren<Props>) {
  return (
    <>
      {showExpandArrow && (
        <i
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...row.getToggleRowExpandedProps()}
          className={`fas ${arrowClass(row.isExpanded)} space-right`}
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  function arrowClass(isExpanded: boolean) {
    if (isExpanded) {
      return 'fa-angle-down';
    }
    return 'fa-angle-right';
  }
}
