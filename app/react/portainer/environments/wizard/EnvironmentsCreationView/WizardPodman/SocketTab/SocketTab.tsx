import { Environment } from '@/react/portainer/environments/types';

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
        Connecting to Podman via socket is only supported for Linux
        environments. Please use the Agent or Edge Agent options if you&apos;re
        running Podman on Windows or Mac.
      </TextTip>
      <DeploymentScripts />

      <div className="mt-5">
        <SocketForm onCreate={onCreate} containerEngine="podman" />
      </div>
    </>
  );
}
