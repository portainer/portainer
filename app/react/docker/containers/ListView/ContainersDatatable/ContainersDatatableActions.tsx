import { useRouter } from '@uirouter/react';
import { Pause, Play, RefreshCw, Slash, Square, Trash2 } from 'lucide-react';

import * as notifications from '@/portainer/services/notifications';
import { useAuthorizations, Authorized } from '@/react/hooks/useUser';
import { confirmContainerDeletion } from '@/react/docker/containers/common/confirm-container-delete-modal';
import { setPortainerAgentTargetHeader } from '@/portainer/services/http-request.helper';
import {
  ContainerId,
  ContainerStatus,
  ContainerListViewModel,
} from '@/react/docker/containers/types';
import {
  killContainer,
  pauseContainer,
  removeContainer,
  restartContainer,
  resumeContainer,
  startContainer,
  stopContainer,
} from '@/react/docker/containers/containers.service';
import type { EnvironmentId } from '@/react/portainer/environments/types';

import { ButtonGroup, Button, AddButton } from '@@/buttons';

type ContainerServiceAction = (
  endpointId: EnvironmentId,
  containerId: ContainerId
) => Promise<void>;

interface Props {
  selectedItems: ContainerListViewModel[];
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
    (item) => item.State === ContainerStatus.Paused
  );
  const hasStoppedItemsSelected = selectedItems.some((item) =>
    [
      ContainerStatus.Stopped,
      ContainerStatus.Created,
      ContainerStatus.Exited,
    ].includes(item.Status)
  );
  const hasRunningItemsSelected = selectedItems.some((item) =>
    [
      ContainerStatus.Running,
      ContainerStatus.Healthy,
      ContainerStatus.Unhealthy,
      ContainerStatus.Starting,
    ].includes(item.Status)
  );

  const { authorized } = useAuthorizations([
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

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <ButtonGroup>
        <Authorized authorizations="DockerContainerStart">
          <Button
            color="light"
            data-cy="start-docker-container-button"
            onClick={() => onStartClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasStoppedItemsSelected}
            icon={Play}
          >
            Start
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerStop">
          <Button
            color="light"
            data-cy="stop-docker-container-button"
            onClick={() => onStopClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasRunningItemsSelected}
            icon={Square}
          >
            Stop
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerKill">
          <Button
            color="light"
            data-cy="kill-docker-container-button"
            onClick={() => onKillClick(selectedItems)}
            disabled={selectedItemCount === 0 || hasStoppedItemsSelected}
            icon={Slash}
          >
            Kill
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerRestart">
          <Button
            color="light"
            data-cy="restart-docker-container-button"
            onClick={() => onRestartClick(selectedItems)}
            disabled={selectedItemCount === 0}
            icon={RefreshCw}
          >
            Restart
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerPause">
          <Button
            color="light"
            data-cy="pause-docker-container-button"
            onClick={() => onPauseClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasRunningItemsSelected}
            icon={Pause}
          >
            Pause
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerUnpause">
          <Button
            color="light"
            data-cy="resume-docker-container-button"
            onClick={() => onResumeClick(selectedItems)}
            disabled={selectedItemCount === 0 || !hasPausedItemsSelected}
            icon={Play}
          >
            Resume
          </Button>
        </Authorized>

        <Authorized authorizations="DockerContainerDelete">
          <Button
            color="dangerlight"
            data-cy="remove-docker-container-button"
            onClick={() => onRemoveClick(selectedItems)}
            disabled={selectedItemCount === 0}
            icon={Trash2}
          >
            Remove
          </Button>
        </Authorized>
      </ButtonGroup>
      {isAddActionVisible && (
        <div className="space-left">
          <Authorized authorizations="DockerContainerCreate">
            <AddButton data-cy="add-docker-container-button">
              Add container
            </AddButton>
          </Authorized>
        </div>
      )}
    </div>
  );

  function onStartClick(selectedItems: ContainerListViewModel[]) {
    const successMessage = 'Container successfully started';
    const errorMessage = 'Unable to start container';
    executeActionOnContainerList(
      selectedItems,
      startContainer,
      successMessage,
      errorMessage
    );
  }

  function onStopClick(selectedItems: ContainerListViewModel[]) {
    const successMessage = 'Container successfully stopped';
    const errorMessage = 'Unable to stop container';
    executeActionOnContainerList(
      selectedItems,
      stopContainer,
      successMessage,
      errorMessage
    );
  }

  function onRestartClick(selectedItems: ContainerListViewModel[]) {
    const successMessage = 'Container successfully restarted';
    const errorMessage = 'Unable to restart container';
    executeActionOnContainerList(
      selectedItems,
      restartContainer,
      successMessage,
      errorMessage
    );
  }

  function onKillClick(selectedItems: ContainerListViewModel[]) {
    const successMessage = 'Container successfully killed';
    const errorMessage = 'Unable to kill container';
    executeActionOnContainerList(
      selectedItems,
      killContainer,
      successMessage,
      errorMessage
    );
  }

  function onPauseClick(selectedItems: ContainerListViewModel[]) {
    const successMessage = 'Container successfully paused';
    const errorMessage = 'Unable to pause container';
    executeActionOnContainerList(
      selectedItems,
      pauseContainer,
      successMessage,
      errorMessage
    );
  }

  function onResumeClick(selectedItems: ContainerListViewModel[]) {
    const successMessage = 'Container successfully resumed';
    const errorMessage = 'Unable to resume container';
    executeActionOnContainerList(
      selectedItems,
      resumeContainer,
      successMessage,
      errorMessage
    );
  }

  async function onRemoveClick(selectedItems: ContainerListViewModel[]) {
    const isOneContainerRunning = selectedItems.some(
      (container) => container.State === 'running'
    );

    const runningTitle = isOneContainerRunning ? 'running' : '';
    const title = `You are about to remove one or more ${runningTitle} containers.`;

    const result = await confirmContainerDeletion(title);
    if (!result) {
      return;
    }
    const { removeVolumes } = result;

    removeSelectedContainers(selectedItems, removeVolumes);
  }

  async function executeActionOnContainerList(
    containers: ContainerListViewModel[],
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
    containers: ContainerListViewModel[],
    removeVolumes: boolean
  ) {
    for (let i = 0; i < containers.length; i += 1) {
      const container = containers[i];
      try {
        await removeContainer(endpointId, container.Id, {
          removeVolumes,
          nodeName: container.NodeName,
        });
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
