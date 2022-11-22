import { Task } from '@/react/nomad/types';

import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { useColumns } from './columns';

export interface Props {
  data: Task[];
}

export function TasksDatatable({ data }: Props) {
  const columns = useColumns();

  return (
    <NestedDatatable
      columns={columns}
      dataset={data}
      defaultSortBy="taskName"
    />
  );
}
