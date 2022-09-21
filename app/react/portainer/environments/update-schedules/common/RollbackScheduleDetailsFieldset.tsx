import { useFormikContext } from 'formik';
import { useEffect, useMemo } from 'react';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { TextTip } from '@@/Tip/TextTip';

import { usePreviousVersions } from '../queries/usePreviousVersions';

import { FormValues } from './types';
import { useEdgeGroupsEnvironmentIds } from './useEdgeGroupsEnvironmentIds';
import { ScheduledTimeField } from './ScheduledTimeField';

export function RollbackScheduleDetailsFieldset() {
  const environmentsCount = useSelectedEnvironmentsCount();
  const { isLoading } = useSelectEnvironmentsOnMount();

  const groupNames = useGroupNames();

  if (isLoading || !groupNames) {
    return null;
  }

  return (
    <div className="mt-3">
      {environmentsCount > 0 ? (
        <div className="form-group">
          <div className="col-sm-12">
            {environmentsCount} edge device(s) from {groupNames} will rollback
            to their previous versions
          </div>
        </div>
      ) : (
        <TextTip>
          The are no rollback options available for yor selected groups(s)
        </TextTip>
      )}

      <ScheduledTimeField />
    </div>
  );
}

function useSelectedEnvironmentsCount() {
  const {
    values: { environments },
  } = useFormikContext<FormValues>();

  return Object.keys(environments).length;
}

function useSelectEnvironmentsOnMount() {
  const previousVersionsQuery = usePreviousVersions();

  const {
    values: { groupIds },
    setFieldValue,
  } = useFormikContext<FormValues>();

  const edgeGroupsEnvironmentIds = useEdgeGroupsEnvironmentIds(groupIds);

  const envIdsToUpdate = useMemo(
    () =>
      previousVersionsQuery.data
        ? Object.fromEntries(
            edgeGroupsEnvironmentIds
              .map((id) => [id, previousVersionsQuery.data[id] || ''] as const)
              .filter(([, version]) => !!version)
          )
        : [],
    [edgeGroupsEnvironmentIds, previousVersionsQuery.data]
  );

  useEffect(() => {
    setFieldValue('environments', envIdsToUpdate);
  }, [envIdsToUpdate, setFieldValue]);

  return { isLoading: previousVersionsQuery.isLoading };
}

function useGroupNames() {
  const {
    values: { groupIds },
  } = useFormikContext<FormValues>();

  const groupsQuery = useEdgeGroups({
    select: (groups) => Object.fromEntries(groups.map((g) => [g.Id, g.Name])),
  });

  if (!groupsQuery.data) {
    return null;
  }

  return groupIds.map((id) => groupsQuery.data[id]).join(', ');
}
