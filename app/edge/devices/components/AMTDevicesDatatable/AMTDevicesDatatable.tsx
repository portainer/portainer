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
  dataset: Device[];
}

export function AMTDevicesDatatable({
                                        environmentId,
                                      dataset,
                                    }: AMTDevicesTableProps) {

    console.log("AMTDevicesDatatable");
    console.log(environmentId);
    console.log(dataset)
    const columns = useColumns();

    const {isLoading, data, error} = useAMTDevices(environmentId);
    console.log(`isLoading: ${  isLoading}`);
    console.log(data);
    console.log(`error: ${  error}`);
    console.log(data);

    const devices = data || [];

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
        data: devices,
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
              // TODO apply styles
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
