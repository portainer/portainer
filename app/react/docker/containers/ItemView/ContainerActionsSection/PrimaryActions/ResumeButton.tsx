import { Play } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { ContainerId } from '../../../types';
import { useResumeContainer } from '../queries/useResumeContainer';

interface ResumeButtonProps {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  isPaused: boolean;
  isPortainer: boolean;
  onSuccess?(): void;
}

export function ResumeButton({
  environmentId,
  containerId,
  nodeName,
  isPaused,
  isPortainer,
  onSuccess = () => {},
}: ResumeButtonProps) {
  const resumeMutation = useResumeContainer();

  function handleResume() {
    resumeMutation.mutate(
      { environmentId, containerId, nodeName },
      {
        onSuccess() {
          notifySuccess('Success', 'Container successfully resumed');
          onSuccess();
        },
      }
    );
  }

  return (
    <Authorized authorizations="DockerContainerUnpause">
      <LoadingButton
        color="light"
        size="small"
        onClick={handleResume}
        disabled={!isPaused || isPortainer}
        isLoading={resumeMutation.isLoading}
        loadingText="Resuming..."
        data-cy="unpause-container-button"
        icon={Play}
      >
        Resume
      </LoadingButton>
    </Authorized>
  );
}
