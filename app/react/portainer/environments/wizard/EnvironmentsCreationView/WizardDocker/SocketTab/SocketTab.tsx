import { Environment } from '@/react/portainer/environments/types';

import { DeploymentScripts } from '../APITab/DeploymentScripts';

import { SocketForm } from './SocketForm';

interface Props {
  onCreate(environment: Environment): void;
  isDockerStandalone?: boolean;
}

export function SocketTab({ onCreate, isDockerStandalone }: Props) {
  return (
    <>
      <DeploymentScripts />

      <div className="mt-5">
        <SocketForm
          onCreate={onCreate}
          isDockerStandalone={isDockerStandalone}
        />
      </div>
    </>
  );
}
