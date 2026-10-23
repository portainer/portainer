import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Clock } from 'lucide-react';
import { createColumnHelper, TableOptions } from '@tanstack/react-table';

import { isEditableTableMeta } from '@@/datatables/editable/isEditableTableMeta';
import { EditableDatatable } from '@@/datatables/editable/EditableDatatable';

import { BasicTableSettings } from '../types';
import { TableState } from '../useTableState';

import { actionsColumn } from './actionsColumn';

interface BasicRow {
  id: number;
  Name: string;
  Created: string;
}

type Args = {
  isLoading: boolean;
  data: BasicRow[];
  settings: TableState<BasicTableSettings>;
  columns: TableOptions<BasicRow>['columns'];
};

export default {
  component: EditableDatatable,
  title: 'Components/Tables/EditableDatatable',
} as Meta;

function Template({ isLoading, data, settings, columns }: Args) {
  return (
    <EditableDatatable
      columns={columns}
      isLoading={isLoading}
      dataset={data}
      settingsManager={settings}
      title="Edge Jobs"
      titleIcon={Clock}
      data-cy="edge-jobs-datatable"
      acceptRow={() => {}}
      revertRow={() => {}}
    />
  );
}

const columnHelper = createColumnHelper<BasicRow>();

export const Default: StoryFn<Args> = Template.bind({});
const editableColumns = [
  columnHelper.accessor('Name', {
    header: 'Name',
    cell: ({ row: { original, index }, table }) => {
      if (!isEditableTableMeta(table.options.meta)) {
        return null;
      }

      const editableRowIndex = table.options.meta.getEditableRow();
      return index === editableRowIndex ? (
        <input type="text" name="name" value={original.Name} />
      ) : (
        <div>{original.Name}</div>
      );
    },
  }),
  columnHelper.accessor('Created', {
    header: 'Created',
  }),
  actionsColumn<BasicRow>(() => {}),
];
Default.args = {
  isLoading: false,
  data: [
    { id: 1, Name: 'Juan', Created: '2021-01-21' },
    { id: 2, Name: 'Ji Hee', Created: '2023-03-01' },
    { id: 3, Name: 'Saki', Created: '2023-08-16' },
    { id: 4, Name: 'Eve', Created: '2017-11-06' },
  ],
  columns: editableColumns,
  settings: {
    sortBy: { id: '', desc: true },
    setSortBy: () => {},
    search: '',
    setSearch: () => {},
    pageSize: 10,
    setPageSize: () => {},
  },
};
