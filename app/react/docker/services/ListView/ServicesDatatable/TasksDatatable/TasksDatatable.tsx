import { DecoratedTask } from '@/react/docker/services/ItemView/TasksDatatable/types';
import { status } from '@/react/docker/services/ItemView/TasksDatatable/columns/status';
import { actions } from '@/react/docker/services/ItemView/TasksDatatable/columns/actions';
import { slot } from '@/react/docker/services/ItemView/TasksDatatable/columns/slot';
import { node } from '@/react/docker/services/ItemView/TasksDatatable/columns/node';
import { updated } from '@/react/docker/services/ItemView/TasksDatatable/columns/updated';

import { NestedDatatable } from '@@/datatables/NestedDatatable';

import { task } from './task-column';

const columns = [status, task, actions, slot, node, updated];

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
      aria-label="Tasks table"
    />
  );
}
