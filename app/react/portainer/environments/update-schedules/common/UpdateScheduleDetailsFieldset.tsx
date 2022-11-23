import { useFormikContext } from 'formik';
import { useCurrentStateAndParams } from '@uirouter/react';

import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';

import { useActiveSchedules } from '../queries/useActiveSchedules';

import { ScheduledTimeField } from './ScheduledTimeField';
import { FormValues } from './types';
import { EnvironmentSelection } from './EnvironmentSelection';
import { ActiveSchedulesNotice } from './ActiveSchedulesNotice';
import { useEdgeGroupsEnvironmentIds } from './useEdgeGroupsEnvironmentIds';

export function UpdateScheduleDetailsFieldset() {
  const { values } = useFormikContext<FormValues>();

  const edgeGroupsEnvironmentIds = useEdgeGroupsEnvironmentIds(values.groupIds);

  const environments = useEnvironments(edgeGroupsEnvironmentIds);
  const activeSchedules = useRelevantActiveSchedules(edgeGroupsEnvironmentIds);

  return (
    <>
      <ActiveSchedulesNotice
        selectedEdgeGroupIds={values.groupIds}
        activeSchedules={activeSchedules}
        environments={environments}
      />

      <EnvironmentSelection
        activeSchedules={activeSchedules}
        environments={environments}
      />

      <ScheduledTimeField />
    </>
  );
}

function useEnvironments(environmentsIds: Array<EnvironmentId>) {
  const environmentsQuery = useEnvironmentList(
    { endpointIds: environmentsIds, types: EdgeTypes },
    undefined,
    undefined,
    environmentsIds.length > 0
  );

  return environmentsQuery.environments;
}

function useRelevantActiveSchedules(environmentIds: EnvironmentId[]) {
  const { params } = useCurrentStateAndParams();

  const scheduleId = params.id ? parseInt(params.id, 10) : 0;

  const activeSchedulesQuery = useActiveSchedules(environmentIds);

  return (
    activeSchedulesQuery.data?.filter(
      (schedule) => schedule.scheduleId !== scheduleId
    ) || []
  );
}
