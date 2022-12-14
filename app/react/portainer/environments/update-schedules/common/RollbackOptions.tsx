import { useFormikContext } from 'formik';
import _ from 'lodash';
import { useMemo, useEffect } from 'react';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { TextTip } from '@@/Tip/TextTip';

import { usePreviousVersions } from '../queries/usePreviousVersions';

import { FormValues } from './types';
import { useEdgeGroupsEnvironmentIds } from './useEdgeGroupsEnvironmentIds';

export function RollbackOptions() {
  const { isLoading, count, version, versionError } = useSelectVersionOnMount();

  const groupNames = useGroupNames();

  if (versionError) {
    return <TextTip>{versionError}</TextTip>;
  }

  if (!count) {
    return (
      <TextTip>
        The are no rollback options available for yor selected groups(s)
      </TextTip>
    );
  }

  if (isLoading || !groupNames) {
    return null;
  }

  return (
    <div className="form-group">
      <div className="col-sm-12">
        {count} edge device(s) from {groupNames} will rollback to version{' '}
        {version}
      </div>
    </div>
  );
}

function useSelectVersionOnMount() {
  const {
    values: { groupIds, version },
    setFieldValue,
    setFieldError,
    errors: { version: versionError },
  } = useFormikContext<FormValues>();

  const environmentIdsQuery = useEdgeGroupsEnvironmentIds(groupIds);

  const previousVersionsQuery = usePreviousVersions<string[]>({
    enabled: !!environmentIdsQuery.data,
  });

  const previousVersions = useMemo(
    () =>
      previousVersionsQuery.data
        ? _.uniq(
            _.compact(
              environmentIdsQuery.data?.map(
                (envId) => previousVersionsQuery.data[envId]
              )
            )
          )
        : [],
    [environmentIdsQuery.data, previousVersionsQuery.data]
  );

  useEffect(() => {
    switch (previousVersions.length) {
      case 0:
        setFieldError('version', 'No rollback options available');
        break;
      case 1:
        setFieldValue('version', previousVersions[0]);
        break;
      default:
        setFieldError(
          'version',
          'Rollback is not available for these edge group as there are multiple version types to rollback to'
        );
    }
  }, [previousVersions, setFieldError, setFieldValue]);

  return {
    isLoading: previousVersionsQuery.isLoading,
    versionError,
    version,
    count: environmentIdsQuery.data?.length,
  };
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
