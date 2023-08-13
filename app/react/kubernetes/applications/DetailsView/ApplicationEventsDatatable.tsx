import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';

import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';

import { useTableState } from '@@/datatables/useTableState';

import {
  useApplication,
  useApplicationPods,
  useApplicationServices,
} from '../application.queries';
import { EventsDatatable } from '../../components/KubernetesEventsDatatable';

import { useNamespaceEventsQuery } from './useNamespaceEventsQuery';

const storageKey = 'k8sAppEventsDatatable';
const settingsStore = createStore(storageKey, { id: 'Date', desc: true });

export function ApplicationEventsDatatable() {
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
    <EventsDatatable
      dataset={relatedEvents}
      tableState={tableState}
      isLoading={
        applicationQuery.isLoading ||
        eventsQuery.isLoading ||
        servicesQuery.isLoading ||
        podsQuery.isLoading
      }
      data-cy="k8sAppDetail-eventsTable"
      noWidget
    />
  );
}
