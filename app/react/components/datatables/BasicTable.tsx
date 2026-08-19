import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  TableOptions,
  useReactTable,
} from '@tanstack/react-table';
import { ComponentType, ReactNode } from 'react';

import { AutomationTestingProps } from '@/types';

import { Icon } from '@@/Icon';

import { defaultGetRowId } from './defaultGetRowId';
import { DefaultType } from './types';

interface Props<D extends DefaultType> extends AutomationTestingProps {
  dataset: D[];
  columns: TableOptions<D>['columns'];
  getRowId?(row: D): string;
  emptyContentLabel?: string;
  title?: ReactNode;
  titleIcon?: ComponentType<{ className?: string; size?: number | string }>;
  initialSortBy?: { id: string; desc: boolean };
  'aria-label'?: string;
}

export function BasicTable<D extends DefaultType>({
  dataset,
  columns,
  getRowId = defaultGetRowId,
  emptyContentLabel = 'No items.',
  title,
  titleIcon,
  initialSortBy,
  'data-cy': dataCy,
  'aria-label': ariaLabel,
}: Props<D>) {
  const tableInstance = useReactTable<D>({
    columns,
    data: dataset,
    getRowId,
    initialState: {
      sorting: initialSortBy ? [initialSortBy] : [],
    },
    defaultColumn: {
      enableColumnFilter: false,
      enableHiding: false,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const headerGroups = tableInstance.getHeaderGroups();
  const { rows } = tableInstance.getRowModel();

  return (
    <div className="w-full" data-cy={dataCy}>
      {title && (
        <div className="flex items-center gap-2 px-4 pb-2 text-sm font-medium text-[color:var(--text-main-color)]">
          {titleIcon && <Icon icon={titleIcon} size="md" />}
          <span>{title}</span>
        </div>
      )}
      <table
        className="w-full border-collapse"
        aria-label={
          ariaLabel ?? (typeof title === 'string' ? title : undefined)
        }
      >
        <thead>
          {headerGroups.map((hg) => (
            <tr
              key={hg.id}
              className="border-b border-solid border-[color:var(--border-widget)]"
            >
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 text-left text-xs font-semibold uppercase text-[color:var(--text-summary-color,var(--text-main-color))]"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={Number.MAX_SAFE_INTEGER}
                className="py-4 text-center text-sm text-[color:var(--text-summary-color,var(--text-main-color))]"
              >
                {emptyContentLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-solid border-[color:var(--border-widget)] last:border-b-0"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-2 align-middle text-sm text-[color:var(--text-main-color)]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
