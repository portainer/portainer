import type { Environment } from '@/react/portainer/environments/types';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

export function EnvironmentURL({ environment }: { environment: Environment }) {
  if (isEdgeEnvironment(environment.Type)) {
    return null;
  }

  return (
    <span className="small text-muted vertical-center">{environment.URL}</span>
  );
}
