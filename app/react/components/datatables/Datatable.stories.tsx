import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Clock } from 'lucide-react';
import { createColumnHelper, TableOptions } from '@tanstack/react-table';

import { BasicTableSettings } from './types';
import { TableState } from './useTableState';
import { Datatable } from './Datatable';

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
  component: Datatable,
  title: 'Components/Tables/Datatable',
} as Meta;

function Template({ isLoading, data, settings, columns }: Args) {
  return (
    <Datatable
      columns={columns}
      isLoading={isLoading}
      dataset={data}
      settingsManager={settings}
      title="Edge Jobs"
      titleIcon={Clock}
      data-cy="edge-jobs-datatable"
    />
  );
}

const columnHelper = createColumnHelper<BasicRow>();

export const Default: StoryFn<Args> = Template.bind({});
const defaultColumns = [
  columnHelper.accessor('Name', {
    header: 'Name',
  }),
  columnHelper.accessor('Created', {
    header: 'Created',
  }),
];
Default.args = {
  isLoading: false,
  data: [
    { id: 1, Name: 'Juan', Created: '2021-01-21' },
    { id: 2, Name: 'Ji Hee', Created: '2023-03-01' },
    { id: 3, Name: 'Saki', Created: '2023-08-16' },
    { id: 4, Name: 'Eve', Created: '2017-11-06' },
  ],
  columns: defaultColumns,
  settings: {
    sortBy: { id: '', desc: true },
    setSortBy: () => {},
    search: '',
    setSearch: () => {},
    pageSize: 10,
    setPageSize: () => {},
  },
};
