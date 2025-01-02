import { ColumnDef } from '@tanstack/react-table';

import { CollapseExpandButton } from '../CollapseExpandButton';

import { DefaultType } from './types';

export function buildExpandColumn<T extends DefaultType>(): ColumnDef<T> {
  return {
    id: 'expand',
    header: ({ table }) => {
      const hasExpandableItems = table.getCanSomeRowsExpand();

      return (
        hasExpandableItems && (
          <CollapseExpandButton
            isExpanded={table.getIsAllRowsExpanded()}
            onClick={table.getToggleAllRowsExpandedHandler()}
            data-cy="expand-all-rows-button"
            aria-label={
              table.getIsAllRowsExpanded()
                ? 'Collapse all rows'
                : 'Expand all rows'
            }
          />
        )
      );
    },
    cell: ({ row }) =>
      row.getCanExpand() && (
        <CollapseExpandButton
          isExpanded={row.getIsExpanded()}
          onClick={row.getToggleExpandedHandler()}
          data-cy={`expand-row-button_${row.index}`}
        />
      ),
    enableColumnFilter: false,
    enableGlobalFilter: false,
    enableHiding: false,
    meta: {
      width: 40,
    },
  };
}
