import { ChevronDown, ChevronUp } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@@/buttons';

export function buildExpandColumn<
  T extends Record<string, unknown>
>(): ColumnDef<T> {
  return {
    id: 'expand',
    header: ({ table }) => {
      const hasExpandableItems = table.getExpandedRowModel().rows.length > 0;

      return (
        hasExpandableItems && (
          <Button
            onClick={table.getToggleAllRowsExpandedHandler()}
            color="none"
            icon={table.getIsAllRowsExpanded() ? ChevronDown : ChevronUp}
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
