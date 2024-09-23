import { useState } from 'react';
import moment from 'moment';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';

import { useEvents } from '../proxy/queries/useEvents';

import { EventsDatatable } from './EventsDatatables';

export function ListView() {
  const { since, until } = useDateRange();
  const envId = useEnvironmentId();
  const eventsQuery = useEvents(envId, { params: { since, until } });

  return (
    <>
      <PageHeader title="Event list" breadcrumbs="Events" reload />

      <EventsDatatable dataset={eventsQuery.data} />
    </>
  );
}

function useDateRange() {
  return useState(() => {
    const since = moment().subtract(24, 'hour').unix();
    const until = moment().unix();

    return { since, until };
  })[0];
}
