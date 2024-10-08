import { Heart, Power } from 'lucide-react';

import { Icon } from '@/react/components/Icon';

import {
  ContainerListViewModel,
  ContainerStatus as Status,
} from '../containers/types';

interface Props {
  containers: ContainerListViewModel[];
}

export function useContainerStatusComponent(
  containers: ContainerListViewModel[]
) {
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

function runningContainersFilter(containers: ContainerListViewModel[]) {
  return containers.filter(
    (container) =>
      container.Status === Status.Running || container.Status === Status.Healthy
  ).length;
}
function stoppedContainersFilter(containers: ContainerListViewModel[]) {
  return containers.filter(
    (container) =>
      container.Status === Status.Exited || container.Status === Status.Stopped
  ).length;
}
function healthyContainersFilter(containers: ContainerListViewModel[]) {
  return containers.filter((container) => container.Status === Status.Healthy)
    .length;
}
function unhealthyContainersFilter(containers: ContainerListViewModel[]) {
  return containers.filter((container) => container.Status === Status.Unhealthy)
    .length;
}
