import _ from 'lodash';
import clsx from 'clsx';
import { CellProps, Column } from 'react-table';

import { Task } from '@/react/nomad/types';

import { DefaultFilter } from '@@/datatables/Filter';

export const taskStatus: Column<Task> = {
  Header: 'Task Status',
  accessor: 'State',
  id: 'status',
  Filter: DefaultFilter,
  canHide: true,
  sortType: 'string',
  Cell: StateCell,
};

function StateCell({ value }: CellProps<Task, string>) {
  const className = getClassName();

  return <span className={clsx('label', className)}>{value}</span>;

  function getClassName() {
    if (['dead'].includes(_.toLower(value))) {
      return 'label-danger';
    }

    if (['pending'].includes(_.toLower(value))) {
      return 'label-warning';
    }

    return 'label-success';
  }
}
