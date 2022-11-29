import { PropsWithChildren } from 'react';
import { Row } from 'react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Icon } from '@@/Icon';

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
          <Icon
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...row.getToggleRowExpandedProps()}
            icon={row.isExpanded ? ChevronDown : ChevronRight}
            className="mr-1"
          />
        </button>
      )}
      {children}
    </>
  );
}
