import { useFormikContext } from 'formik';
import semverCompare from 'semver-compare';
import _ from 'lodash';
import { useEffect } from 'react';

import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';

import { TextTip } from '@@/Tip/TextTip';

import { FormValues } from './types';
import { useEdgeGroupsEnvironmentIds } from './useEdgeGroupsEnvironmentIds';
import { VersionSelect } from './VersionSelect';
import { defaultValue, ScheduledTimeField } from './ScheduledTimeField';

export function UpdateScheduleDetailsFieldset() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  const environmentIdsQuery = useEdgeGroupsEnvironmentIds(values.groupIds);

  const edgeGroupsEnvironmentIds = environmentIdsQuery.data || [];
  const environments = useEnvironments(edgeGroupsEnvironmentIds);
  const minVersion = _.first(
    _.compact<string>(environments.map((env) => env.Agent.Version)).sort(
      (a, b) => semverCompare(a, b)
    )
  );

  // old version is version that doesn't support scheduling of updates
  const hasNoTimeZone = environments.some((env) => !env.LocalTimeZone);
  const hasTimeZone = environments.some((env) => env.LocalTimeZone);

  useEffect(() => {
    if (!hasTimeZone) {
      setFieldValue('scheduledTime', '');
    } else if (!values.scheduledTime) {
      setFieldValue('scheduledTime', defaultValue());
    }
  }, [setFieldValue, hasTimeZone, values.scheduledTime]);

  return (
    <>
      {edgeGroupsEnvironmentIds.length > 0 ? (
        !!values.version && (
          <TextTip color="blue">
            {edgeGroupsEnvironmentIds.length} environment(s) will be updated to{' '}
            {values.version}
          </TextTip>
        )
      ) : (
        <TextTip color="orange">
          No environments options for the selected edge groups
        </TextTip>
      )}

      <VersionSelect minVersion={minVersion} />

      {hasTimeZone && <ScheduledTimeField />}
      {hasNoTimeZone && (
        <TextTip>
          These edge groups have older versions of the edge agent that do not
          support scheduling, these will happen immediately
        </TextTip>
      )}
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
