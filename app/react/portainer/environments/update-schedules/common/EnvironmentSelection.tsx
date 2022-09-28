import _ from 'lodash';

import { Environment } from '@/react/portainer/environments/types';

import { TextTip } from '@@/Tip/TextTip';

import { ActiveSchedule } from '../queries/useActiveSchedules';
import { useSupportedAgentVersions } from '../queries/useSupportedAgentVersions';

import { EnvironmentSelectionItem } from './EnvironmentSelectionItem';
import { compareVersion } from './utils';

interface Props {
  environments: Environment[];
  activeSchedules: ActiveSchedule[];
  disabled?: boolean;
}

export function EnvironmentSelection({
  environments,
  activeSchedules,
  disabled,
}: Props) {
  const supportedAgentVersionsQuery = useSupportedAgentVersions({
    select: (versions) =>
      versions.map((version) => ({ label: version, value: version })),
  });

  if (!supportedAgentVersionsQuery.data) {
    return null;
  }

  const supportedAgentVersions = supportedAgentVersionsQuery.data;

  const latestVersion = _.last(supportedAgentVersions)?.value;

  const environmentsToUpdate = environments.filter(
    (env) =>
      activeSchedules.every((schedule) => schedule.environmentId !== env.Id) &&
      compareVersion(env.Agent.Version, latestVersion)
  );

  const versionGroups = Object.entries(
    _.mapValues(
      _.groupBy(environmentsToUpdate, (env) => env.Agent.Version),
      (envs) => envs.map((env) => env.Id)
    )
  );

  if (environmentsToUpdate.length === 0) {
    return (
      <TextTip>
        The are no update options available for yor selected groups(s)
      </TextTip>
    );
  }

  return (
    <div className="form-group">
      <div className="col-sm-12">
        {versionGroups.map(([version, environmentIds]) => (
          <EnvironmentSelectionItem
            currentVersion={version}
            environmentIds={environmentIds}
            key={version}
            versions={supportedAgentVersions}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
