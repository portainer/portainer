import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';
import { TableHeaderProps } from 'react-table';

import { Button } from '@@/buttons';

import { useTableContext } from './TableContainer';
import styles from './TableHeaderCell.module.css';

interface Props {
  canFilter: boolean;
  canSort: boolean;
  headerProps: TableHeaderProps;
  isSorted: boolean;
  isSortedDesc?: boolean;
  onSortClick: (desc: boolean) => void;
  render: () => ReactNode;
  renderFilter: () => ReactNode;
}

export function TableHeaderCell({
  headerProps: { className, role, style },
  canSort,
  render,
  onSortClick,
  isSorted,
  isSortedDesc,
  canFilter,
  renderFilter,
}: Props) {
  useTableContext();

  return (
    <th role={role} style={style} className={className}>
      <SortWrapper
        canSort={canSort}
        onClick={onSortClick}
        isSorted={isSorted}
        isSortedDesc={isSortedDesc}
      >
        {render()}
      </SortWrapper>
      {canFilter ? renderFilter() : null}
    </th>
  );
}

interface SortWrapperProps {
  canSort: boolean;
  isSorted: boolean;
  isSortedDesc?: boolean;
  onClick: (desc: boolean) => void;
}

function SortWrapper({
  canSort,
  children,
  onClick,
  isSorted,
  isSortedDesc,
}: PropsWithChildren<SortWrapperProps>) {
  if (!canSort) {
    return <>{children}</>;
  }

  return (
    <Button
      color="link"
      type="button"
      onClick={() => onClick(!isSortedDesc)}
      className="sortable"
    >
      <span className="sortable-label">{children}</span>

      {isSorted ? (
        <i
          className={clsx(
            'fa',
            'space-left',
            isSortedDesc ? 'fa-sort-alpha-up' : 'fa-sort-alpha-down',
            styles.sortIcon
          )}
          aria-hidden="true"
        />
      ) : (
        <div className={styles.sortIcon} />
      )}
    </Button>
  );
}
