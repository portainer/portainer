import clsx from 'clsx';

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
          <Icon
            icon="power"
            className={clsx('icon icon-sm icon-success')}
            feather
          />
          {runningContainersFilter(containers)} running
        </div>
        <div className="vertical-center space-right">
          <Icon
            icon="power"
            className={clsx('icon icon-sm icon-danger')}
            feather
          />
          {stoppedContainersFilter(containers)} stopped
        </div>
      </div>
      <div>
        <div className="vertical-center space-right pr-5">
          <Icon
            icon="heart"
            className={clsx('icon icon-sm icon-success')}
            feather
          />
          {healthyContainersFilter(containers)} healthy
        </div>
        <div className="vertical-center space-right">
          <Icon
            icon="heart"
            className={clsx('icon icon-sm icon-danger')}
            feather
          />
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
  return containers.filter((container) => container.Status === 'exited').length;
}
function healthyContainersFilter(containers: DockerContainer[]) {
  return containers.filter((container) => container.Status === 'healthy')
    .length;
}
function unhealthyContainersFilter(containers: DockerContainer[]) {
  return containers.filter((container) => container.Status === 'unhealthy')
    .length;
}
