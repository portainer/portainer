import { Task } from '@/react/nomad/types';

import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { columns } from './columns';

export interface Props {
  data: Task[];
}

export function TasksDatatable({ data }: Props) {
  return (
    <NestedDatatable
      columns={columns}
      dataset={data}
      initialSortBy={{ id: 'taskName', desc: false }}
    />
  );
}
