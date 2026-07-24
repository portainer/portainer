import { compact } from 'lodash';

import { Event } from '@/react/kubernetes/queries/types';
import { createStore } from '@/react/kubernetes/datatables/default-kube-datatable-store';
import { EventsDatatable } from '@/react/kubernetes/components/EventsDatatable';
import { useEvents } from '@/react/kubernetes/queries/useEvents';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { useTableState } from '@@/datatables/useTableState';
import { Widget } from '@@/Widget';
import { TextTip } from '@@/Tip/TextTip';

import { GenericResource } from '../../types';

export const storageKey = 'k8sHelmEventsDatatable';
export const settingsStore = createStore(storageKey, {
  id: 'Date',
  desc: true,
});

export function HelmEventsDatatable({
  namespace,
  releaseResources,
}: {
  namespace: string;
  releaseResources: GenericResource[];
}) {
  const environmentId = useEnvironmentId();
  const tableState = useTableState(settingsStore, storageKey);

  const eventsQuery = useEvents(environmentId, {
    namespace,
    queryOptions: {
      autoRefreshRate: tableState.autoRefreshRateMS,
      select: (data) => filterRelatedEvents(data, releaseResources),
    },
  });

  return (
    <Widget>
      <EventsDatatable
        dataset={eventsQuery.data || []}
        title={
          <TextTip inline color="blue" className="!text-xs">
            Only events for resources currently in the cluster will be
            displayed.
          </TextTip>
        }
        titleIcon={null}
        tableState={tableState}
        isLoading={eventsQuery.isInitialLoading}
        data-cy="k8sAppDetail-eventsTable"
        // no widget to avoid extra padding from app/react/components/datatables/TableContainer.tsx
        noWidget
      />
    </Widget>
  );
}

export function useHelmEventsTableState() {
  return useTableState(settingsStore, storageKey);
}

export function filterRelatedEvents(
  events: Event[],
  resources: GenericResource[]
) {
  const relatedUids = getReleaseUids(resources);
  const relatedUidsSet = new Set(relatedUids);
  return events.filter(
    (event) =>
      event.involvedObject.uid && relatedUidsSet.has(event.involvedObject.uid)
  );
}

function getReleaseUids(resources: GenericResource[]) {
  return compact(resources.map((resource) => resource.metadata.uid));
}
