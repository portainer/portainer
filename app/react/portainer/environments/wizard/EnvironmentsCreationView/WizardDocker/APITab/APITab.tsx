import { Environment } from '@/portainer/environments/types';

import { APIForm } from './APIForm';
import { DeploymentScripts } from './DeploymentScripts';

interface Props {
  onCreate(environment: Environment): void;
}

export function APITab({ onCreate }: Props) {
  return (
    <>
      <DeploymentScripts />

      <div className="mt-5">
        <APIForm onCreate={onCreate} />
      </div>
    </>
  );
}
