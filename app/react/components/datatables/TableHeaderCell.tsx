import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';
import { TableHeaderProps } from 'react-table';

import { useTableContext } from './TableContainer';
import { TableHeaderSortIcons } from './TableHeaderSortIcons';

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
      <div className="flex flex-row flex-nowrap h-full items-center gap-1">
        <SortWrapper
          canSort={canSort}
          onClick={onSortClick}
          isSorted={isSorted}
          isSortedDesc={isSortedDesc}
        >
          {render()}
        </SortWrapper>
        {canFilter ? renderFilter() : null}
      </div>
    </th>
  );
}

interface SortWrapperProps {
  canSort: boolean;
  isSorted: boolean;
  isSortedDesc?: boolean;
  onClick?: (desc: boolean) => void;
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
    <button
      type="button"
      onClick={() => onClick && onClick(!isSortedDesc)}
      className={clsx(
        'sortable !bg-transparent w-full h-full !ml-0 !px-0 border-none focus:border-none text-gray-9 !hover:text-gray-9',
        isSorted && 'sortingActive'
      )}
    >
      <div className="flex flex-row justify-start items-center w-full h-full">
        {children}
        <TableHeaderSortIcons
          sorted={isSorted}
          descending={isSorted && !!isSortedDesc}
        />
      </div>
    </button>
  );
}

interface AngularTableCellProps {
  colTitle: string;
  canSort: boolean;
  isSorted?: boolean;
  isSortedDesc?: boolean;
}

export function TableColumnHeaderAngular({
  canSort,
  isSorted,
  colTitle,
  isSortedDesc,
}: AngularTableCellProps) {
  return (
    <div className="flex flex-row flex-nowrap h-full">
      <SortWrapper
        canSort={canSort}
        isSorted={!!isSorted}
        isSortedDesc={isSortedDesc}
      >
        {colTitle}
      </SortWrapper>
    </div>
  );
}
