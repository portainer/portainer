import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';

import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { useTableState } from '@@/datatables/useTableState';

import {
  useApplication,
  useApplicationPods,
  useApplicationServices,
} from '../application.queries';
import { EventsDatatable } from '../../components/EventsDatatable';
import { useEvents } from '../../queries/useEvents';
import { AppKind } from '../types';

const storageKey = 'k8sAppEventsDatatable';
const settingsStore = createStore(storageKey, { id: 'Date', desc: true });

export function ApplicationEventsDatatable() {
  const tableState = useTableState(settingsStore, storageKey);
  const {
    params: {
      namespace,
      name,
      'resource-type': appKind,
      endpointId: environmentId,
    },
  } = useCurrentStateAndParams();

  const { relatedEvents, isInitialLoading } = useApplicationEvents(
    environmentId,
    namespace,
    name,
    appKind,
    {
      autoRefreshRate: tableState.autoRefreshRate,
    }
  );

  return (
    <EventsDatatable
      dataset={relatedEvents}
      tableState={tableState}
      isLoading={isInitialLoading}
      data-cy="k8sAppDetail-eventsTable"
      noWidget
    />
  );
}

export function useApplicationEvents(
  environmentId: EnvironmentId,
  namespace: string,
  name: string,
  appKind?: AppKind,
  options?: { autoRefreshRate?: number; yaml?: boolean }
) {
  const { data: application, ...applicationQuery } = useApplication(
    environmentId,
    namespace,
    name,
    appKind
  );
  const servicesQuery = useApplicationServices(
    environmentId,
    namespace,
    name,
    application
  );
  const podsQuery = useApplicationPods(
    environmentId,
    namespace,
    name,
    application
  );

  const { data: events, ...eventsQuery } = useEvents(environmentId, {
    namespace,
    queryOptions: {
      autoRefreshRate: options?.autoRefreshRate
        ? options.autoRefreshRate * 1000
        : undefined,
    },
  });

  // related events are events that have the application id, or the id of a service or pod from the application
  const relatedEvents = useMemo(() => {
    const serviceIds = servicesQuery.data?.map(
      (service) => service?.metadata?.uid
    );
    const podIds = podsQuery.data?.map((pod) => pod?.metadata?.uid);
    return (
      events?.filter(
        (event) =>
          event.involvedObject.uid === application?.metadata?.uid ||
          serviceIds?.includes(event.involvedObject.uid) ||
          podIds?.includes(event.involvedObject.uid)
      ) || []
    );
  }, [application?.metadata?.uid, events, podsQuery.data, servicesQuery.data]);

  const isInitialLoading =
    applicationQuery.isInitialLoading ||
    servicesQuery.isInitialLoading ||
    podsQuery.isInitialLoading ||
    eventsQuery.isInitialLoading;

  return { relatedEvents, isInitialLoading };
}
