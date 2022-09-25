import { useFormikContext } from 'formik';
import semverCompare from 'semver-compare';
import _ from 'lodash';

import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';

import { TextTip } from '@@/Tip/TextTip';

import { FormValues } from './types';
import { useEdgeGroupsEnvironmentIds } from './useEdgeGroupsEnvironmentIds';
import { VersionSelect } from './VersionSelect';

export function UpdateScheduleDetailsFieldset() {
  const { values } = useFormikContext<FormValues>();

  const environmentIdsQuery = useEdgeGroupsEnvironmentIds(values.groupIds);

  const edgeGroupsEnvironmentIds = environmentIdsQuery.data || [];
  const environments = useEnvironments(edgeGroupsEnvironmentIds);
  const minVersion = _.first(
    _.compact<string>(environments.map((env) => env.Agent.Version)).sort(
      (a, b) => semverCompare(a, b)
    )
  );

  return (
    <>
      {!!(edgeGroupsEnvironmentIds.length && values.version) && (
        <TextTip color="blue">
          {edgeGroupsEnvironmentIds.length} environment(s) will be updated to{' '}
          {values.version}
        </TextTip>
      )}

      <VersionSelect minVersion={minVersion} />
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
