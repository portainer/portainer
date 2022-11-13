import { NomadSnapshot } from '@/react/portainer/environments/types';
import { addPlural } from '@/portainer/helpers/strings';

import { EnvironmentStatsItem } from '@@/EnvironmentStatsItem';

interface Props {
  snapshot?: NomadSnapshot;
}

export function EnvironmentStatsNomad({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <EnvironmentStatsItem
        value={addPlural(snapshot.JobCount, 'job')}
        icon="list"
        featherIcon
      />
      <EnvironmentStatsItem
        value={addPlural(snapshot.GroupCount, 'group')}
        icon="svg-objectgroup"
      />
      <EnvironmentStatsItem
        value={addPlural(snapshot.TaskCount, 'task')}
        icon="box"
        featherIcon
      >
        {snapshot.TaskCount > 0 && (
          <>
            <EnvironmentStatsItem
              value={snapshot.RunningTaskCount}
              icon="power"
              featherIcon
              iconClass="icon-success"
            />
            <EnvironmentStatsItem
              value={snapshot.TaskCount - snapshot.RunningTaskCount}
              icon="power"
              featherIcon
              iconClass="icon-danger"
            />
          </>
        )}
      </EnvironmentStatsItem>

      <EnvironmentStatsItem
        value={addPlural(snapshot.NodeCount, 'node')}
        icon="hard-drive"
        featherIcon
      />
    </>
  );
}
