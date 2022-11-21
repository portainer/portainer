import { Power } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  running: number;
  stopped: number;
}

export function RunningStatus({ running, stopped }: Props) {
  return (
    <div>
      <div>
        <Icon icon={Power} mode="success" />
        {`${running || '-'} running`}
      </div>
      <div>
        <Icon icon={Power} mode="danger" />
        {`${stopped || '-'} stopped`}
      </div>
    </div>
  );
}
