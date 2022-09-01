import { ChevronDown, ChevronUp } from 'react-feather';
import { CellProps, Column, HeaderProps } from 'react-table';

import { Button } from '@@/buttons';

export function buildExpandColumn<T extends Record<string, unknown>>(
  isExpandable: (item: T) => boolean
): Column<T> {
  return {
    id: 'expand',
    Header: ({
      filteredFlatRows,
      getToggleAllRowsExpandedProps,
      isAllRowsExpanded,
    }: HeaderProps<T>) => {
      const hasExpandableItems = filteredFlatRows.some((item) =>
        isExpandable(item.original)
      );

      return (
        hasExpandableItems && (
          <Button
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...getToggleAllRowsExpandedProps()}
            color="none"
            icon={isAllRowsExpanded ? ChevronDown : ChevronUp}
          />
        )
      );
    },
    Cell: ({ row }: CellProps<T>) => (
      <div className="vertical-center">
        {isExpandable(row.original) && (
          <Button
            /*  eslint-disable-next-line react/jsx-props-no-spreading */
            {...row.getToggleRowExpandedProps()}
            color="none"
            icon={row.isExpanded ? ChevronDown : ChevronUp}
          />
        )}
      </div>
    ),
    disableFilters: true,
    Filter: () => null,
    canHide: false,
    width: 30,
    disableResizing: true,
  };
}
