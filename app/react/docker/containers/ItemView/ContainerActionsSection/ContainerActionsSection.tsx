import { EnvironmentId } from '@/react/portainer/environments/types';
import { useAuthorizations } from '@/react/hooks/useUser';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { isPartOfSwarmService } from '@/docker/helpers/containers';

import { Widget, WidgetBody } from '@@/Widget';

import { PrimaryActions } from './PrimaryActions';
import { SecondaryActions } from './SecondaryActions';

interface Props {
  environmentId: EnvironmentId;
  nodeName?: string;
  container: ContainerDetailsViewModel;
  onSuccess?(): void;
}

export function ContainerActionsSection({
  environmentId,
  nodeName,
  container,
  onSuccess,
}: Props) {
  const authorizedQuery = useAuthorizations([
    'DockerContainerStart',
    'DockerContainerStop',
    'DockerContainerKill',
    'DockerContainerRestart',
    'DockerContainerPause',
    'DockerContainerUnpause',
    'DockerContainerDelete',
    'DockerContainerCreate',
  ]);

  if (!authorizedQuery.authorized || !container.Id) {
    return null;
  }

  const isRunning = container.State?.Running || false;
  const isPaused = container.State?.Paused || false;
  const isPortainer = container.IsPortainer || false;
  return (
    <Widget>
      <Widget.Title icon="settings" title="Actions" />
      <WidgetBody>
        <div className="flex gap-2">
          <PrimaryActions
            environmentId={environmentId}
            containerId={container.Id}
            nodeName={nodeName}
            isRunning={isRunning}
            isPaused={isPaused}
            isPortainer={isPortainer}
            onSuccess={onSuccess}
          />
          <SecondaryActions
            environmentId={environmentId}
            containerId={container.Id}
            containerImage={container.Config?.Image || ''}
            containerAutoRemove={container.HostConfig?.AutoRemove}
            nodeName={nodeName}
            partOfSwarmService={isPartOfSwarmService(container)}
            isPortainer={isPortainer}
          />
        </div>
      </WidgetBody>
    </Widget>
  );
}
