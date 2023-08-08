import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';
import { Event } from 'kubernetes-types/core/v1';
import { History } from 'lucide-react';

import { IndexOptional } from '@/react/kubernetes/configs/types';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { useNamespaceEventsQuery } from '../../event.service';
import {
  useApplication,
  useApplicationPods,
  useApplicationServices,
} from '../../application.queries';

import { columns } from './columns';

const storageKey = 'k8sAppEventsDatatable';
const settingsStore = createStore(storageKey, { id: 'Date', desc: true });

export function EventsDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const {
    params: {
      namespace,
      name,
      'resource-type': resourceType,
      endpointId: environmentId,
    },
  } = useCurrentStateAndParams();

  const { data: application, ...applicationQuery } = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );
  const { data: services, ...servicesQuery } = useApplicationServices(
    environmentId,
    namespace,
    name,
    application
  );
  const { data: pods, ...podsQuery } = useApplicationPods(
    environmentId,
    namespace,
    name,
    application
  );
  const { data: events, ...eventsQuery } = useNamespaceEventsQuery(
    environmentId,
    namespace,
    {
      autoRefreshRate: tableState.autoRefreshRate * 1000,
    }
  );

  // related events are events that have the application id, or the id of a service or pod from the application
  const relatedEvents = useMemo(() => {
    const serviceIds = services?.map((service) => service?.metadata?.uid);
    const podIds = pods?.map((pod) => pod?.metadata?.uid);
    return (
      events?.filter(
        (event) =>
          event.involvedObject.uid === application?.metadata?.uid ||
          serviceIds?.includes(event.involvedObject.uid) ||
          podIds?.includes(event.involvedObject.uid)
      ) || []
    );
  }, [application?.metadata?.uid, events, pods, services]);

  return (
    <Datatable<IndexOptional<Event>>
      dataset={relatedEvents}
      columns={columns}
      settingsManager={tableState}
      isLoading={
        applicationQuery.isLoading ||
        eventsQuery.isLoading ||
        servicesQuery.isLoading ||
        podsQuery.isLoading
      }
      emptyContentLabel="No event available."
      title="Events"
      titleIcon={History}
      getRowId={(row) => row.metadata?.uid || ''}
      disableSelect
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      data-cy="k8sAppDetail-eventsTable"
      noWidget
    />
  );
}
