import { Power } from 'lucide-react';

import { StatsItem } from '@@/StatsItem';

interface Props {
  running: number;
  stopped: number;
}

export function RunningStatus({ running, stopped }: Props) {
  return (
    <div>
      <div>
        <StatsItem
          value={`${running || '-'} running`}
          icon={Power}
          iconClass="icon-success"
        />
        {`${running || '-'} running`}
      </div>
      <div>
        <StatsItem
          value={`${stopped || '-'} stopped`}
          icon={Power}
          iconClass="icon-danger"
        />
        {`${stopped || '-'} stopped`}
      </div>
    </div>
  );
}
