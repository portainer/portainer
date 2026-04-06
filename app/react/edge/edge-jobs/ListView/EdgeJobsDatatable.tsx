import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { useEdgeJobs } from '../queries/useEdgeJobs';

import { TableActions } from './TableActions';
import { columns } from './columns';

const tableKey = 'edge-jobs';

const settingsStore = createPersistedStore(tableKey);

export function EdgeJobsDatatable() {
  const { t } = useTranslation();
  const jobsQuery = useEdgeJobs();
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <Datatable
      columns={columns}
      isLoading={jobsQuery.isLoading}
      dataset={jobsQuery.data || []}
      settingsManager={tableState}
      title={t('edge.jobs_title')}
      titleIcon={Clock}
      renderTableActions={(selectedItems) => (
        <TableActions selectedItems={selectedItems} />
      )}
      data-cy="edge-jobs-datatable"
    />
  );
}
