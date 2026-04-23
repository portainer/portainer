import { BrushCleaning, Check } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess, notifyError } from '@/portainer/services/notifications';
import { Authorized } from '@/react/hooks/useUser';
import { humanize } from '@/portainer/filters/filters';

import { LoadingButton } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { usePruneImagesMutation } from '../../queries/usePruneImagesMutation';
import { ImagesListResponse } from '../../queries/useImages';

import { confirmPruneImages } from './ConfirmPruneModal';

interface Props {
  images: ImagesListResponse[];
}

export function PruneButton({ images }: Props) {
  const environmentId = useEnvironmentId();
  const pruneMutation = usePruneImagesMutation(environmentId);

  const hasPrunableImages = images.some((image) => !image.used);

  const button = (
    <LoadingButton
      color="default"
      icon={hasPrunableImages ? BrushCleaning : Check}
      onClick={handlePrune}
      isLoading={pruneMutation.isLoading}
      loadingText="Pruning..."
      data-cy="image-pruneButton"
      disabled={!hasPrunableImages}
    >
      Prune
    </LoadingButton>
  );

  if (hasPrunableImages) {
    return (
      <Authorized authorizations="DockerImagePrune" adminOnlyCE>
        {button}
      </Authorized>
    );
  }

  return (
    <Authorized authorizations="DockerImagePrune" adminOnlyCE>
      <TooltipWithChildren message="No unused images available to prune">
        <span>{button}</span>
      </TooltipWithChildren>
    </Authorized>
  );

  async function handlePrune() {
    const result = await confirmPruneImages(images);

    if (!result) {
      return;
    }

    pruneMutation.mutate(
      { all: result.pruneAll, clearBuildCache: result.clearBuildCache },
      {
        onSuccess: ({ SpaceReclaimed, buildCacheError }) => {
          const message =
            SpaceReclaimed === 0
              ? 'Reclaimed 0 B - the image layers may still be in use by other images, or are still in the Docker build cache.'
              : `Reclaimed ${humanize(SpaceReclaimed)}`;
          notifySuccess('Images pruned', message);
          if (buildCacheError) {
            notifyError('Failed to clear Docker build cache', buildCacheError);
          }
        },
        onError: (error) => {
          notifyError('Failed to prune images', error);
        },
      }
    );
  }
}
