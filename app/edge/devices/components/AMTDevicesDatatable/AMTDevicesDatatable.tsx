import { useTable, usePagination } from 'react-table';

import {
  Table,
  TableContainer,
  TableHeaderRow,
  TableRow,
} from '@/portainer/components/datatables/components';
import { InnerDatatable } from '@/portainer/components/datatables/components/InnerDatatable';
import { Device } from '@/portainer/hostmanagement/open-amt/model';
import PortainerError from '@/portainer/error';

import { useColumns } from './columns';

export interface AMTDevicesTableProps {
  devices: Device[];
  isLoading: boolean;
  error?: PortainerError;
}

export function AMTDevicesDatatable({
  devices,
  isLoading,
  error,
}: AMTDevicesTableProps) {
  const columns = useColumns();

  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } =
    useTable<Device>(
      {
        columns,
        data: devices,
      },
      usePagination
    );

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
    <InnerDatatable>
      <TableContainer>
        <Table
          className={tableProps.className}
          role={tableProps.role}
          style={tableProps.style}
        >
          <thead>
            {headerGroups.map((headerGroup) => {
              const { key, className, role, style } =
                headerGroup.getHeaderGroupProps();
              return (
                <TableHeaderRow<Device>
                  key={key}
                  className={className}
                  role={role}
                  style={style}
                  headers={headerGroup.headers}
                />
              );
            })}
          </thead>
          <tbody
            className={tbodyProps.className}
            role={tbodyProps.role}
            style={tbodyProps.style}
          >
            {!isLoading && devices && devices.length > 0 ? (
              page.map((row) => {
                prepareRow(row);
                const { key, className, role, style } = row.getRowProps();

                return (
                  <TableRow<Device>
                    cells={row.cells}
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                  />
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  {userMessage(isLoading, error)}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableContainer>
    </InnerDatatable>
  );

  function userMessage(isLoading: boolean, error?: PortainerError) {
    if (isLoading) {
      return 'Loading...';
    }

    if (error) {
      return error.message;
    }

    return 'No devices found';
  }
}
