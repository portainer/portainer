import {
  useTable,
    usePagination,
} from 'react-table';
import {
  Table,
  TableContainer,
  TableHeaderRow,
  TableRow,
} from 'Portainer/components/datatables/components';
import { Checkbox } from 'Portainer/components/form-components/Checkbox';
import { Device } from "Portainer/hostmanagement/open-amt/model";
import {useEnvironment} from "Portainer/environments/useEnvironment";

import {useAMTDevices} from "@/edge/devices/components/AMTDevicesDatatable/useAMTDevices";
import {RowProvider} from "@/edge/devices/components/AMTDevicesDatatable/columns/RowContext";

import { useColumns } from './columns';

export function AMTDevicesDatatable() {
    const columns = useColumns();

    const environment = useEnvironment();
    const {isLoading, devices, error} = useAMTDevices(environment.Id);

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
          {(!isLoading && devices && devices.length > 0) && (
              page.map((row) => {
                prepareRow(row);
                const { key, className, role, style } = row.getRowProps();

                return (
                    <RowProvider key={key}>
                        <TableRow<Device>
                            cells={row.cells}
                            key={key}
                            className={className}
                            role={role}
                            style={style}
                        />
                    </RowProvider>
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
