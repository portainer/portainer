import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { columns } from './columns';
import { DecoratedTask } from './types';

export function TasksDatatable({
  dataset,
  search,
}: {
  dataset: DecoratedTask[];
  search?: string;
}) {
  return (
    <NestedDatatable
      columns={columns}
      dataset={dataset}
      search={search}
      emptyContentLabel="No task matching filter."
    />
  );
}
