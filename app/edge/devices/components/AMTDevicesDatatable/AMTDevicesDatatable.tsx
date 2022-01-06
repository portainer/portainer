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

import { useColumns } from './columns';

export interface AMTDevicesTableProps {
    environmentId: EnvironmentId;
  dataset: Device[];
}

export function AMTDevicesDatatable({
                                        environmentId,
                                      dataset,
                                    }: AMTDevicesTableProps) {


    console.log("AMTDevicesDatatable props:");
    console.log(environmentId);
    console.log(dataset);

  const columns = useColumns();

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
        data: dataset,
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
            className={tableProps.className}
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
          {page.map((row) => {
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
          })}
          </tbody>
        </Table>
      </TableContainer>
  );
}
