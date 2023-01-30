import { useFormikContext } from 'formik';
import { useEffect } from 'react';

import { RollbackOptions } from './RollbackOptions';
import { FormValues } from './types';
import { useEdgeGroupsEnvironmentIds } from './useEdgeGroupsEnvironmentIds';
import { useEnvironments } from './useEnvironments';
import { defaultValue, ScheduledTimeField } from './ScheduledTimeField';

export function RollbackScheduleDetailsFieldset() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  const environmentIdsQuery = useEdgeGroupsEnvironmentIds(values.groupIds);

  const edgeGroupsEnvironmentIds = environmentIdsQuery.data || [];
  const environments = useEnvironments(edgeGroupsEnvironmentIds);

  // old version is version that doesn't support scheduling of updates
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
    <div className="mt-3">
      <RollbackOptions />
      {hasTimeZone && hasGroupSelected && <ScheduledTimeField />}
    </div>
  );
}
