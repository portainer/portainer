import {
  CellContext,
  ColumnDef,
  ColumnDefTemplate,
} from '@tanstack/react-table';

import { humanize, isoDateFromTimestamp } from '@/portainer/filters/filters';

import { FileData } from '../types';

import { columnHelper } from './helper';
import { NameCell } from './NameCell';
import { ActionsCell } from './ActionsCell';

export const columns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    cell: NameCell,
  }),
  columnHelper.accessor('Size', {
    header: 'Size',
    cell: hideIfCustom(({ getValue }) => humanize(getValue())),
  }),
  columnHelper.accessor('ModTime', {
    header: 'Last modification',
    cell: hideIfCustom(({ getValue }) => isoDateFromTimestamp(getValue())),
  }),
  columnHelper.display({
    header: 'Actions',
    cell: hideIfCustom(ActionsCell),
  }),
  columnHelper.accessor('Dir', {}), // workaround, to enable sorting by Dir (put directory first)
] as ColumnDef<FileData>[];

function hideIfCustom<TValue>(
  template: ColumnDefTemplate<CellContext<FileData, TValue>>
): ColumnDefTemplate<CellContext<FileData, TValue>> {
  return (props) => {
    if (props.row.original.custom) {
      return null;
    }
    return typeof template === 'string' ? template : template(props);
  };
}
