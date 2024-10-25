import { useCurrentStateAndParams } from '@uirouter/react';
import { useMemo } from 'react';

import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';

import { useTableState } from '@@/datatables/useTableState';

import { useEvents } from '../../queries/useEvents';
import { useApplication } from '../queries/useApplication';
import { useApplicationServices } from '../queries/useApplicationServices';
import { useApplicationPods } from '../queries/useApplicationPods';

const storageKey = 'k8sAppEventsDatatable';
const settingsStore = createStore(storageKey, { id: 'Date', desc: true });

export function useApplicationEventsTableState() {
  return useTableState(settingsStore, storageKey);
}

export function useApplicationEventsTableData() {
  const appEventsTableState = useTableState(settingsStore, storageKey);
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
  const { data: events, ...eventsQuery } = useEvents(environmentId, {
    namespace,
    queryOptions: {
      autoRefreshRate: appEventsTableState.autoRefreshRate * 1000,
    },
  });

  // related events are events that have the application id, or the id of a service or pod from the application
  const appEventsData = useMemo(() => {
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

  const appEventWarningCount = useMemo(
    () => appEventsData.filter((event) => event.type === 'Warning').length,
    [appEventsData]
  );

  return {
    appEventsData,
    appEventWarningCount,
    isAppEventsTableLoading:
      applicationQuery.isLoading ||
      servicesQuery.isLoading ||
      podsQuery.isLoading ||
      eventsQuery.isLoading,
  };
}
