import { DockerContainer } from '../containers/types';

interface Props {
  containers: DockerContainer[];
}

export function useContainerStatusComponent(containers: DockerContainer[]) {
  return <ContainerStatus containers={containers} />;
}

export function ContainerStatus({ containers }: Props) {
  return (
    <>
      <div className="pull-right pl-1">
        <div>
          <i className="fa fa-power-off space-right green-icon" />
          {runningContainersFilter(containers)} running
        </div>
        <div>
          <i className="fa fa-power-off space-right red-icon" />
          {stoppedContainersFilter(containers)} stopped
        </div>
      </div>
      <div className="pull-right pr-5">
        <div>
          <i className="fa fa-heartbeat space-right green-icon" />
          {healthyContainersFilter(containers)} healthy
        </div>
        <div>
          <i className="fa fa-heartbeat space-right orange-icon" />
          {unhealthyContainersFilter(containers)} unhealthy
        </div>
      </div>
    </>
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
