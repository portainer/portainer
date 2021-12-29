import { useRouter } from '@uirouter/react';

import * as notifications from '@/portainer/services/notifications';
import { useAuthorizations, Authorized } from '@/portainer/hooks/useUser';
import { Link } from '@/portainer/components/Link';
import { confirmContainerDeletion } from '@/portainer/services/modal.service/prompt';
import { setPortainerAgentTargetHeader } from '@/portainer/services/http-request.helper';
import type { ContainerId, DockerContainer } from '@/docker/containers/types';
import {
  killContainer,
  pauseContainer,
  removeContainer,
  restartContainer,
  resumeContainer,
  startContainer,
  stopContainer,
} from '@/docker/containers/containers.service';
import type { EnvironmentId } from '@/portainer/environments/types';
import { ButtonGroup, Button } from '@/portainer/components/Button';

type ContainerServiceAction = (
  endpointId: EnvironmentId,
  containerId: ContainerId
) => Promise<void>;

interface Props {
  selectedItems: DockerContainer[];
  isAddActionVisible: boolean;
  endpointId: EnvironmentId;
}

export function ContainersDatatableActions({
  selectedItems,
  isAddActionVisible,
  endpointId,
}: Props) {
  const selectedItemCount = selectedItems.length;
  const hasPausedItemsSelected = selectedItems.some(
    (item) => item.Status === 'paused'
  );
  const hasStoppedItemsSelected = selectedItems.some((item) =>
    ['stopped', 'created'].includes(item.Status)
  );
  const hasRunningItemsSelected = selectedItems.some((item) =>
    ['running', 'healthy', 'unhealthy', 'starting'].includes(item.Status)
  );

  const isAuthorized = useAuthorizations([
    'DockerContainerStart',
    'DockerContainerStop',
    'DockerContainerKill',
    'DockerContainerRestart',
    'DockerContainerPause',
    'DockerContainerUnpause',
    'DockerContainerDelete',
    'DockerContainerCreate',
  ]);

  const router = useRouter();

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="actionBar">
      <ButtonGroup>
        <Authorized authorizations="DockerContainerStart">
          <Button
            color="success"
            onClick={() => onStartClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasStoppedItemsSelected}
          >
            <i className="fa fa-play space-right" aria-hidden="true" />
            Start
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerStop">
          <Button
            color="danger"
            onClick={() => onStopClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasRunningItemsSelected}
          >
            <i className="fa fa-stop space-right" aria-hidden="true" />
            Stop
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerKill">
          <Button
            color="danger"
            onClick={() => onKillClick(selectedItems)}
            disabled={selectedItemCount === 0}
          >
            <i className="fa fa-bomb space-right" aria-hidden="true" />
            Kill
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerRestart">
          <Button
            onClick={() => onRestartClick(selectedItems)}
            disabled={selectedItemCount === 0}
          >
            <i className="fa fa-sync space-right" aria-hidden="true" />
            Restart
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerPause">
          <Button
            onClick={() => onPauseClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasRunningItemsSelected}
          >
            <i className="fa fa-pause space-right" aria-hidden="true" />
            Pause
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerUnpause">
          <Button
            onClick={() => onResumeClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasPausedItemsSelected}
          >
            <i className="fa fa-play space-right" aria-hidden="true" />
            Resume
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerDelete">
          <Button
            color="danger"
            onClick={() => onRemoveClick(selectedItems)}
            disabled={selectedItemCount === 0}
          >
            <i className="fa fa-trash-alt space-right" aria-hidden="true" />
            Remove
          </Button>
        </Authorized>
      </ButtonGroup>

      {isAddActionVisible && (
        <Authorized authorizations="DockerContainerCreate">
          <Link to="docker.containers.new" className="space-left">
            <Button>
              <i className="fa fa-plus space-right" aria-hidden="true" />
              Add container
            </Button>
          </Link>
        </Authorized>
      )}
    </div>
  );

  function onStartClick(selectedItems: DockerContainer[]) {
    const successMessage = 'Container successfully started';
    const errorMessage = 'Unable to start container';
    executeActionOnContainerList(
      selectedItems,
      startContainer,
      successMessage,
      errorMessage
    );
  }

  function onStopClick(selectedItems: DockerContainer[]) {
    const successMessage = 'Container successfully stopped';
    const errorMessage = 'Unable to stop container';
    executeActionOnContainerList(
      selectedItems,
      stopContainer,
      successMessage,
      errorMessage
    );
  }

  function onRestartClick(selectedItems: DockerContainer[]) {
    const successMessage = 'Container successfully restarted';
    const errorMessage = 'Unable to restart container';
    executeActionOnContainerList(
      selectedItems,
      restartContainer,
      successMessage,
      errorMessage
    );
  }

  function onKillClick(selectedItems: DockerContainer[]) {
    const successMessage = 'Container successfully killed';
    const errorMessage = 'Unable to kill container';
    executeActionOnContainerList(
      selectedItems,
      killContainer,
      successMessage,
      errorMessage
    );
  }

  function onPauseClick(selectedItems: DockerContainer[]) {
    const successMessage = 'Container successfully paused';
    const errorMessage = 'Unable to pause container';
    executeActionOnContainerList(
      selectedItems,
      pauseContainer,
      successMessage,
      errorMessage
    );
  }

  function onResumeClick(selectedItems: DockerContainer[]) {
    const successMessage = 'Container successfully resumed';
    const errorMessage = 'Unable to resume container';
    executeActionOnContainerList(
      selectedItems,
      resumeContainer,
      successMessage,
      errorMessage
    );
  }

  function onRemoveClick(selectedItems: DockerContainer[]) {
    const isOneContainerRunning = selectedItems.some(
      (container) => container.Status === 'running'
    );

    const runningTitle = isOneContainerRunning ? 'running' : '';
    const title = `You are about to remove one or more ${runningTitle} containers.`;

    confirmContainerDeletion(title, (result: string[]) => {
      if (!result) {
        return;
      }
      const cleanVolumes = !!result[0];

      removeSelectedContainers(selectedItems, cleanVolumes);
    });
  }

  async function executeActionOnContainerList(
    containers: DockerContainer[],
    action: ContainerServiceAction,
    successMessage: string,
    errorMessage: string
  ) {
    for (let i = 0; i < containers.length; i += 1) {
      const container = containers[i];
      try {
        setPortainerAgentTargetHeader(container.NodeName);
        await action(endpointId, container.Id);
        notifications.success(successMessage, container.Names[0]);
      } catch (err) {
        notifications.error(
          'Failure',
          err as Error,
          `${errorMessage}:${container.Names[0]}`
        );
      }
    }

    router.stateService.reload();
  }

  async function removeSelectedContainers(
    containers: DockerContainer[],
    cleanVolumes: boolean
  ) {
    for (let i = 0; i < containers.length; i += 1) {
      const container = containers[i];
      try {
        setPortainerAgentTargetHeader(container.NodeName);
        await removeContainer(endpointId, container, cleanVolumes);
        notifications.success(
          'Container successfully removed',
          container.Names[0]
        );
      } catch (err) {
        notifications.error(
          'Failure',
          err as Error,
          'Unable to remove container'
        );
      }
    }

    router.stateService.reload();
  }
}
