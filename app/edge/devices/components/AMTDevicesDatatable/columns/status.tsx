import { CellProps, Column, TableInstance } from 'react-table';
import clsx from 'clsx';
import { Device } from '@/portainer/hostmanagement/open-amt/model';

export const status: Column<Device> = {
  Header: 'MPS Status',
  id: 'status',
  disableFilters: true,
  canHide: true,
  sortType: 'string',
  Cell: StatusCell,
  Filter: () => null,
};

export function StatusCell({
  row: { original: device },
}: CellProps<TableInstance>) {
  return (
    <span className={clsx({ 'text-success': device.connectionStatus })}>
      {device.connectionStatus ? 'Connected' : 'Disconnected'}
    </span>
  );
}
