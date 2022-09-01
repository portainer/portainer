import { useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';

import { EventsDatatable } from './EventsDatatable';
import { useEvents } from './useEvents';

export function EventsView() {
  const environmentId = useEnvironmentId();
  const { query, invalidateQuery } = useEvents();
  const {
    params: { jobID, taskName },
  } = useCurrentStateAndParams();

  const breadcrumbs = [
    {
      label: 'Nomad Jobs',
      link: 'nomad.jobs',
      linkParams: { id: environmentId },
    },
    { label: jobID },
    { label: taskName },
    { label: 'Events' },
  ];

  return (
    <>
      <PageHeader
        title="Event list"
        breadcrumbs={breadcrumbs}
        reload
        loading={query.isLoading || query.isFetching}
        onReload={invalidateQuery}
      />

      <EventsDatatable data={query.data || []} isLoading={query.isLoading} />
    </>
  );
}
