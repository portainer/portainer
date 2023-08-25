import { Environment } from '@/react/portainer/environments/types';

import { DeploymentScripts } from '../APITab/DeploymentScripts';

import { SocketForm } from './SocketForm';

interface Props {
  onCreate(environment: Environment): void;
}

export function SocketTab({ onCreate }: Props) {
  return (
    <>
      <DeploymentScripts />

      <div className="mt-5">
        <SocketForm onCreate={onCreate} />
      </div>
    </>
  );
}
