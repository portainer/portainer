import { Authorized } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { ButtonGroup } from '@@/buttons';

import { ContainerId } from '../../types';

import { RecreateButton } from './SecondaryActions/RecreateButton';
import { DuplicateEditButton } from './SecondaryActions/DuplicateEditButton';
import { useCanRecreateContainer } from './SecondaryActions/useCanRecreateContainer';
import { useCanDuplicateEditContainer } from './SecondaryActions/useCanDuplicateEditContainer';

interface Props {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  containerImage: string;
  containerAutoRemove: boolean | undefined;
  isPortainer: boolean;
  partOfSwarmService: boolean;
}

export function SecondaryActions({
  environmentId,
  containerId,
  nodeName,
  containerImage,
  containerAutoRemove = false,
  isPortainer,
  partOfSwarmService,
}: Props) {
  const displayRecreateButton = useCanRecreateContainer({
    autoRemove: containerAutoRemove,
    partOfSwarmService,
  });

  const displayDuplicateEditButton = useCanDuplicateEditContainer({
    autoRemove: containerAutoRemove,
    partOfSwarmService,
  });

  if (!displayRecreateButton && !displayDuplicateEditButton) {
    return null;
  }

  return (
    <Authorized authorizations="DockerContainerCreate">
      <ButtonGroup>
        {displayRecreateButton && (
          <RecreateButton
            environmentId={environmentId}
            containerId={containerId}
            nodeName={nodeName}
            containerImage={containerImage}
            isPortainer={isPortainer}
          />
        )}

        {displayDuplicateEditButton && (
          <DuplicateEditButton
            containerId={containerId}
            nodeName={nodeName}
            isPortainer={isPortainer}
          />
        )}
      </ButtonGroup>
    </Authorized>
  );
}
