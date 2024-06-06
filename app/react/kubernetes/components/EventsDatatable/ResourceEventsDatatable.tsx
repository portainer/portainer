import { useCurrentStateAndParams } from '@uirouter/react';

import { useKubeStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { useEvents } from '@/react/kubernetes/queries/useEvents';
import { EventsDatatable } from '@/react/kubernetes/components/EventsDatatable';

type Props = {
  storageKey: string;
  /** if undefined, all resources for the namespace (or cluster are returned) */
  resourceId?: string;
  /** if undefined, events are fetched for the cluster */
  namespace?: string;
};

/** ResourceEventsDatatable returns the EventsDatatable for all events that relate to a specific resource id */
export function ResourceEventsDatatable({
  storageKey,
  resourceId,
  namespace,
}: Props) {
  const tableState = useKubeStore(storageKey, {
    id: 'Date',
    desc: true,
  });

  const {
    params: { endpointId },
  } = useCurrentStateAndParams();

  const params = resourceId
    ? { fieldSelector: `involvedObject.uid=${resourceId}` }
    : {};
  const resourceEventsQuery = useEvents(endpointId, {
    namespace,
    params,
    queryOptions: {
      autoRefreshRate: tableState.autoRefreshRate
        ? tableState.autoRefreshRate * 1000
        : undefined,
    },
  });
  const nodeEvents = resourceEventsQuery.data || [];

  return (
    <EventsDatatable
      dataset={nodeEvents}
      tableState={tableState}
      isLoading={resourceEventsQuery.isLoading}
      data-cy="k8sNodeDetail-eventsTable"
      noWidget
    />
  );
}
