import { ChevronDown, ChevronUp } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@@/buttons';

import { DefaultType } from './types';

export function buildExpandColumn<T extends DefaultType>(): ColumnDef<T> {
  return {
    id: 'expand',
    header: ({ table }) => {
      const hasExpandableItems = table.getCanSomeRowsExpand();

      return (
        hasExpandableItems && (
          <Button
            onClick={table.getToggleAllRowsExpandedHandler()}
            color="none"
            icon={table.getIsAllRowsExpanded() ? ChevronDown : ChevronUp}
            title="Expand all"
          />
        )
      );
    },
    cell: ({ row }) =>
      row.getCanExpand() && (
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            row.toggleExpanded();
          }}
          color="none"
          icon={row.getIsExpanded() ? ChevronDown : ChevronUp}
          title={row.getIsExpanded() ? 'Collapse' : 'Expand'}
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
