import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';
import { TableHeaderProps } from 'react-table';

import { Button } from '@@/buttons';

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
      <div className="flex flex-row flex-nowrap">
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
      color="table-header"
      type="button"
      onClick={() => onClick(!isSortedDesc)}
      className={clsx(
        'sortable w-full !ml-0 !px-0',
        isSorted && 'sortingActive'
      )}
    >
      <div className="flex flex-row justify-start items-center w-full h-full">
        {children}
        {canSort && (
          <TableHeaderSortIcons
            sortedAscending={isSorted && !isSortedDesc}
            sortedDescending={isSorted && !!isSortedDesc}
          />
        )}
      </div>
    </Button>
  );
}
