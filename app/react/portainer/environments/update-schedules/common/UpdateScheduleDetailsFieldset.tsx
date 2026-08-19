import _ from 'lodash';

import { Environment } from '@/react/portainer/environments/types';
import { semverCompare } from '@/react/common/semver-utils';

import { TextTip } from '@@/Tip/TextTip';

import { VersionSelect } from './VersionSelect';
import { ScheduledTimeField } from './ScheduledTimeField';

interface Props {
  environments: Environment[];
  hasTimeZone: boolean;
  hasNoTimeZone: boolean;
  hasGroupSelected: boolean;
  version: string;
}

export function UpdateScheduleDetailsFieldset({
  environments,
  hasTimeZone,
  hasNoTimeZone,
  hasGroupSelected,
  version,
}: Props) {
  const minVersion = _.first(
    _.compact<string>(environments.map((env) => env.Agent.Version)).sort(
      (a, b) => semverCompare(a, b)
    )
  );

  return (
    <>
      {environments.length > 0 ? (
        !!version && (
          <TextTip color="blue">
            {environments.length} environment(s) will be updated to {version}
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
