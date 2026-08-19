import { Environment } from '@/react/portainer/environments/types';

import { APIForm } from './APIForm';

interface Props {
  onCreate(environment: Environment): void;
}

export function APITab({ onCreate }: Props) {
  return (
    <div className="mt-5">
      <APIForm onCreate={onCreate} />
    </div>
  );
}
