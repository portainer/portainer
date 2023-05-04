import { Environment } from '@/react/portainer/environments/types';

import { APIForm } from './APIForm';

interface Props {
  onCreate(environment: Environment): void;
  isDockerStandalone?: boolean;
}

export function APITab({ onCreate, isDockerStandalone }: Props) {
  return (
    <div className="mt-5">
      <APIForm onCreate={onCreate} isDockerStandalone={isDockerStandalone} />
    </div>
  );
}
