import { RefreshCw } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { ContainerId } from '../../../types';
import { useRestartContainer } from '../queries/useRestartContainer';

interface RestartButtonProps {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  isRunning: boolean;
  isPortainer: boolean;
  onSuccess?(): void;
}

export function RestartButton({
  environmentId,
  containerId,
  nodeName,
  isRunning,
  isPortainer,
  onSuccess = () => {},
}: RestartButtonProps) {
  const restartMutation = useRestartContainer();

  function handleRestart() {
    restartMutation.mutate(
      { environmentId, containerId, nodeName },
      {
        onSuccess() {
          notifySuccess('Success', 'Container successfully restarted');
          onSuccess();
        },
      }
    );
  }

  return (
    <Authorized authorizations="DockerContainerRestart">
      <LoadingButton
        color="light"
        size="small"
        onClick={handleRestart}
        disabled={!isRunning || isPortainer}
        isLoading={restartMutation.isLoading}
        loadingText="Restarting..."
        data-cy="restart-container-button"
        icon={RefreshCw}
      >
        Restart
      </LoadingButton>
    </Authorized>
  );
}
