import { ColumnDef } from '@tanstack/react-table';

import { Task } from '@/react/nomad/types';

import { taskStatus } from './taskStatus';
import { taskName } from './taskName';
import { taskGroup } from './taskGroup';
import { allocationID } from './allocationID';
import { started } from './started';
import { actions } from './actions';

export const columns = [
  taskStatus,
  taskName,
  taskGroup,
  allocationID,
  actions,
  started,
] as Array<ColumnDef<Task>>;
