import { PropsWithChildren } from 'react';
import { Row } from 'react-table';

import styles from './ExpandingCell.module.css';

interface Props<D extends Record<string, unknown> = Record<string, unknown>> {
  row: Row<D>;
  showExpandArrow: boolean;
}

export function ExpandingCell<
  D extends Record<string, unknown> = Record<string, unknown>
>({ row, showExpandArrow, children }: PropsWithChildren<Props<D>>) {
  return (
    <>
      {showExpandArrow && (
        <button type="button" className={styles.expandButton}>
          <i
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...row.getToggleRowExpandedProps()}
            className={`fas ${arrowClass(row.isExpanded)} space-right`}
            aria-hidden="true"
          />
        </button>
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
