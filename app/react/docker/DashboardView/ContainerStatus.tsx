import { Heart, Power } from 'lucide-react';

import { Icon } from '@/react/components/Icon';

import { DockerContainer } from '../containers/types';

interface Props {
  containers: DockerContainer[];
}

export function useContainerStatusComponent(containers: DockerContainer[]) {
  return <ContainerStatus containers={containers} />;
}

export function ContainerStatus({ containers }: Props) {
  return (
    <div className="pull-right">
      <div>
        <div className="vertical-center space-right pr-5">
          <Icon icon={Power} mode="success" size="sm" />
          {runningContainersFilter(containers)} running
        </div>
        <div className="vertical-center space-right">
          <Icon icon={Power} mode="danger" size="sm" />
          {stoppedContainersFilter(containers)} stopped
        </div>
      </div>
      <div>
        <div className="vertical-center space-right pr-5">
          <Icon icon={Heart} mode="success" size="sm" />
          {healthyContainersFilter(containers)} healthy
        </div>
        <div className="vertical-center space-right">
          <Icon icon={Heart} mode="danger" size="sm" />
          {unhealthyContainersFilter(containers)} unhealthy
        </div>
      </div>
    </div>
  );
}

function runningContainersFilter(containers: DockerContainer[]) {
  return containers.filter((container) => container.Status === 'running')
    .length;
}
function stoppedContainersFilter(containers: DockerContainer[]) {
  return containers.filter(
    (container) =>
      container.Status === 'exited' || container.Status === 'stopped'
  ).length;
}
function healthyContainersFilter(containers: DockerContainer[]) {
  return containers.filter((container) => container.Status === 'healthy')
    .length;
}
function unhealthyContainersFilter(containers: DockerContainer[]) {
  return containers.filter((container) => container.Status === 'unhealthy')
    .length;
}
