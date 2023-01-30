import { useFormikContext } from 'formik';
import semverCompare from 'semver-compare';
import _ from 'lodash';
import { useEffect } from 'react';

import { TextTip } from '@@/Tip/TextTip';

import { useEnvironments } from './useEnvironments';
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
  const hasGroupSelected = values.groupIds.length > 0;

  useEffect(() => {
    if (!hasTimeZone || !hasGroupSelected) {
      setFieldValue('scheduledTime', '');
    } else if (!values.scheduledTime) {
      setFieldValue('scheduledTime', defaultValue());
    }
  }, [setFieldValue, hasTimeZone, values.scheduledTime, hasGroupSelected]);

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

      {hasTimeZone && hasGroupSelected && <ScheduledTimeField />}
      {hasNoTimeZone && (
        <TextTip>
          These edge groups have older versions of the edge agent that do not
          support scheduling, these will happen immediately
        </TextTip>
      )}
    </>
  );
}
