import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { useIsSwarm } from '@/react/docker/proxy/queries/useInfo';

export function useIsDeployable(type: TemplateType) {
  const environmentId = useEnvironmentId();

  const isSwarm = useIsSwarm(environmentId);

  switch (type) {
    case TemplateType.ComposeStack:
    case TemplateType.Container:
      return true;
    case TemplateType.SwarmStack:
      return isSwarm;
    default:
      return false;
  }
}
