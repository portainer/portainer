import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { useIsSwarmManager } from '@/react/docker/proxy/queries/useInfo';

export function useIsDeployable(type: TemplateType) {
  const environmentId = useEnvironmentId();

  // Swarm stacks can only be deployed from a manager node, not a worker.
  const isSwarmManager = useIsSwarmManager(environmentId);

  switch (type) {
    case TemplateType.ComposeStack:
    case TemplateType.Container:
      return true;
    case TemplateType.SwarmStack:
      return isSwarmManager;
    default:
      return false;
  }
}
