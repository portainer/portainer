import { CalendarCheck2 } from 'lucide-react';

import { BasicTable } from '@@/datatables/BasicTable';

import { columns } from '../JobsDatatable/columns';
import { Job } from '../JobsDatatable/types';

interface CronJobsExecutionsProps {
  item: Job[];
}

export function CronJobsExecutionsInnerDatatable({
  item,
}: CronJobsExecutionsProps) {
  return (
    <BasicTable
      dataset={item}
      columns={columns}
      getRowId={(row) => row.Id}
      data-cy="k8s-cronJobs-executions-datatable"
      title="Executions"
      titleIcon={CalendarCheck2}
    />
  );
}
