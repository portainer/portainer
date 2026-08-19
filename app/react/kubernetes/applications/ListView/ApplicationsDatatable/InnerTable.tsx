import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { Application } from './types';
import { useBaseColumns } from './useColumns';

export function InnerTable({
  dataset,
  hideStacks,
}: {
  dataset: Array<Application>;
  hideStacks: boolean;
}) {
  const columns = useBaseColumns(hideStacks);

  return (
    <NestedDatatable
      dataset={dataset}
      columns={columns}
      data-cy="applications-nested-datatable"
      enablePagination={false}
    />
  );
}
