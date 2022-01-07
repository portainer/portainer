import {
  useTable,
    usePagination,
} from 'react-table';
import {EnvironmentId} from "Portainer/environments/types";
import {
  Table,
  TableContainer,
  TableHeaderRow,
  TableRow,
} from 'Portainer/components/datatables/components';
import { Checkbox } from 'Portainer/components/form-components/Checkbox';
import { Device } from "Portainer/hostmanagement/open-amt/model";

import {useAMTDevices} from "@/edge/devices/components/AMTDevicesDatatable/useAMTDevices";

import { useColumns } from './columns';

export interface AMTDevicesTableProps {
    environmentId: EnvironmentId;
}

export function AMTDevicesDatatable({
                                        environmentId,
                                    }: AMTDevicesTableProps) {


    const columns = useColumns();

    const {isLoading, devices, error} = useAMTDevices(environmentId);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,

  } = useTable<Device>(
      {
        defaultCanFilter: false,
        columns,
        data: devices || [],
        initialState: {},
        isRowSelectable() {
          return false
        },
        selectCheckboxComponent: Checkbox,
      },
      usePagination,
  );

  const tableProps = getTableProps();
  const tbodyProps = getTableBodyProps();

  return (
      <TableContainer>

        <Table
            className={`${tableProps.className} inner-datatable`}
            role={tableProps.role}
            style={tableProps.style}
        >
          <thead>
          {headerGroups.map((headerGroup) => {
            const { key, className, role, style } = headerGroup.getHeaderGroupProps();
            return (
                <TableHeaderRow<Device>
                    key={key}
                    className={className}
                    role={role}
                    style={style}
                    headers={headerGroup.headers}
                    onSortChange={() => {}}
                />
            );
          })}
          </thead>
          <tbody
              className={tbodyProps.className}
              role={tbodyProps.role}
              style={tbodyProps.style}
          >
          {(devices && devices.length > 0) && (
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
          )}
          {isLoading && (
              <tr>
                  <td colSpan={5} className="text-center text-muted">Loading...</td>
              </tr>
          )}
          {(!isLoading && (!devices || devices.length === 0)) &&  (
              <tr>
                  <td colSpan={5} className="text-center text-muted">No devices found.</td>
              </tr>
          )}
          {(!isLoading && error) &&  (
              <tr>
                  <td colSpan={5} className="text-center text-muted">{{error}}</td>
              </tr>
          )}

          </tbody>
        </Table>
      </TableContainer>
  );
}
