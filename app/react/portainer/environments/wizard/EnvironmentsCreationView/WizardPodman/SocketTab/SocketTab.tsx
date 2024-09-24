import {
  ContainerEngine,
  Environment,
} from '@/react/portainer/environments/types';

import { TextTip } from '@@/Tip/TextTip';

import { DeploymentScripts } from './DeploymentScripts';
import { SocketForm } from './SocketForm';

interface Props {
  onCreate(environment: Environment): void;
}

export function SocketTab({ onCreate }: Props) {
  return (
    <>
      <TextTip color="orange" className="mb-2" inline={false}>
        To connect via socket, Portainer server must be running in a Podman
        container.
      </TextTip>

      <DeploymentScripts />

      <div className="mt-5">
        <SocketForm
          onCreate={onCreate}
          containerEngine={ContainerEngine.Podman}
        />
      </div>
    </>
  );
}
