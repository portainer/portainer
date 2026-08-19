import { Square } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { ContainerId } from '../../../types';
import { useStopContainer } from '../queries/useStopContainer';

interface StopButtonProps {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  isRunning: boolean;
  isPortainer: boolean;
  onSuccess?(): void;
}

export function StopButton({
  environmentId,
  containerId,
  nodeName,
  isRunning,
  isPortainer,
  onSuccess = () => {},
}: StopButtonProps) {
  const stopMutation = useStopContainer();

  function handleStop() {
    stopMutation.mutate(
      { environmentId, containerId, nodeName },
      {
        onSuccess() {
          notifySuccess('Success', 'Container successfully stopped');
          onSuccess();
        },
      }
    );
  }

  return (
    <Authorized authorizations="DockerContainerStop">
      <LoadingButton
        color="light"
        size="small"
        onClick={handleStop}
        disabled={!isRunning || isPortainer}
        isLoading={stopMutation.isLoading}
        loadingText="Stopping..."
        data-cy="stop-container-button"
        icon={Square}
      >
        Stop
      </LoadingButton>
    </Authorized>
  );
}
