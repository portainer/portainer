import { Pause } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { ContainerId } from '../../../types';
import { usePauseContainer } from '../queries/usePauseContainer';

interface PauseButtonProps {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  isRunning: boolean;
  isPaused: boolean;
  isPortainer: boolean;
  onSuccess?(): void;
}

export function PauseButton({
  environmentId,
  containerId,
  nodeName,
  isRunning,
  isPaused,
  isPortainer,
  onSuccess = () => {},
}: PauseButtonProps) {
  const pauseMutation = usePauseContainer();

  function handlePause() {
    pauseMutation.mutate(
      { environmentId, containerId, nodeName },
      {
        onSuccess() {
          notifySuccess('Success', 'Container successfully paused');
          onSuccess();
        },
      }
    );
  }

  return (
    <Authorized authorizations="DockerContainerPause">
      <LoadingButton
        color="light"
        size="small"
        onClick={handlePause}
        disabled={!isRunning || isPaused || isPortainer}
        isLoading={pauseMutation.isLoading}
        loadingText="Pausing..."
        data-cy="pause-container-button"
        icon={Pause}
      >
        Pause
      </LoadingButton>
    </Authorized>
  );
}
