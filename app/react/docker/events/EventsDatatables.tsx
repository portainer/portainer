import { createColumnHelper } from '@tanstack/react-table';
import { Clock } from 'lucide-react';
import { EventMessage } from 'docker-types';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

import { createEventDetails } from './model';

const columnHelper = createColumnHelper<EventMessage>();

export const columns = [
  columnHelper.accessor('time', {
    header: () => i18n.t('docker.events.date'),
    cell: ({ getValue }) => {
      const value = getValue();
      return isoDateFromTimestamp(value);
    },
  }),
  columnHelper.accessor((c) => c.Type, {
    id: 'type',
    header: () => i18n.t('docker.events.type'),
  }),
  columnHelper.accessor((c) => createEventDetails(c), {
    id: 'details',
    header: () => i18n.t('docker.events.details'),
  }),
];

const tableKey = 'docker-events';
const settingsStore = createPersistedStore(tableKey, {
  id: 'Time',
  desc: true,
});

export function EventsDatatable({
  dataset,
}: {
  dataset?: Array<EventMessage>;
}) {
  const tableState = useTableState(settingsStore, tableKey);
  const { t } = useTranslation();

  return (
    <Datatable
      dataset={dataset ?? []}
      isLoading={!dataset}
      columns={columns}
      settingsManager={tableState}
      title={t('docker.events.table_title')}
      titleIcon={Clock}
      disableSelect
      data-cy="docker-events-datatable"
    />
  );
}
