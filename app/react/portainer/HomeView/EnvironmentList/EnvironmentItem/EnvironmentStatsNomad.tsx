import { Box, Dice4, HardDrive, List, Power } from 'lucide-react';

import { NomadSnapshot } from '@/react/portainer/environments/types';
import { addPlural } from '@/portainer/helpers/strings';

import { StatsItem } from '@@/StatsItem';

interface Props {
  snapshot?: NomadSnapshot;
}

export function EnvironmentStatsNomad({ snapshot }: Props) {
  if (!snapshot) {
    return <>No snapshot available</>;
  }

  return (
    <>
      <StatsItem value={addPlural(snapshot.JobCount, 'job')} icon={List} />
      <StatsItem value={addPlural(snapshot.GroupCount, 'group')} icon={Dice4} />
      <StatsItem value={addPlural(snapshot.TaskCount, 'task')} icon={Box}>
        {snapshot.TaskCount > 0 && (
          <>
            <StatsItem
              value={snapshot.RunningTaskCount}
              icon={Power}
              iconClass="icon-success"
            />
            <StatsItem
              value={snapshot.TaskCount - snapshot.RunningTaskCount}
              icon={Power}
              iconClass="icon-danger"
            />
          </>
        )}
      </StatsItem>

      <StatsItem
        value={addPlural(snapshot.NodeCount, 'node')}
        icon={HardDrive}
      />
    </>
  );
}
