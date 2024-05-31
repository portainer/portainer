import { Heart, Power } from 'lucide-react';

import { Icon } from '@/react/components/Icon';

interface Props {
  stats: {
    running: number;
    stopped: number;
    healthy: number;
    unhealthy: number;
  };
}

export function ContainerStatus({ stats }: Props) {
  return (
    <div className="pull-right">
      <div>
        <div className="vertical-center space-right pr-5">
          <Icon icon={Power} mode="success" size="sm" />
          {stats.running} running
        </div>
        <div className="vertical-center space-right">
          <Icon icon={Power} mode="danger" size="sm" />
          {stats.stopped} stopped
        </div>
      </div>
      <div>
        <div className="vertical-center space-right pr-5">
          <Icon icon={Heart} mode="success" size="sm" />
          {stats.healthy} healthy
        </div>
        <div className="vertical-center space-right">
          <Icon icon={Heart} mode="danger" size="sm" />
          {stats.unhealthy} unhealthy
        </div>
      </div>
    </div>
  );
}
