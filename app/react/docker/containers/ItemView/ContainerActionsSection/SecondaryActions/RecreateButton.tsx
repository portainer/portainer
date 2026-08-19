import { RefreshCw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { confirmContainerRecreation } from '@/react/docker/containers/ItemView/ConfirmRecreationModal';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { ContainerId } from '../../../types';
import { useRecreateContainer } from '../queries/useRecreateContainer';

interface RecreateButtonProps {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  containerImage: string;
  isPortainer: boolean;
}

export function RecreateButton({
  environmentId,
  containerId,
  nodeName,
  containerImage,
  isPortainer,
}: RecreateButtonProps) {
  const recreateMutation = useRecreateContainer();
  const router = useRouter();

  async function handleRecreate() {
    const cannotPullImage =
      !containerImage || containerImage.toLowerCase().startsWith('sha256');

    const result = await confirmContainerRecreation(cannotPullImage);

    if (!result) {
      return;
    }

    recreateMutation.mutate(
      {
        environmentId,
        containerId,
        pullImage: result.pullLatest,
        nodeName,
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Container successfully re-created');
          router.stateService.go('docker.containers', {}, { reload: true });
        },
      }
    );
  }

  return (
    <LoadingButton
      color="light"
      size="small"
      onClick={handleRecreate}
      disabled={isPortainer}
      isLoading={recreateMutation.isLoading}
      loadingText="Recreation in progress..."
      data-cy="recreate-container-button"
      icon={RefreshCw}
    >
      Recreate
    </LoadingButton>
  );
}
