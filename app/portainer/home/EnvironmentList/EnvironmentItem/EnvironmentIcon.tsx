import clsx from 'clsx';

import { environmentTypeIcon } from '@/portainer/filters/filters';
import dockerEdge from '@/assets/images/edge_endpoint.png';
import kube from '@/assets/images/kubernetes_endpoint.png';
import kubeEdge from '@/assets/images/kubernetes_edge_endpoint.png';
import { EnvironmentType } from '@/portainer/environments/types';

interface Props {
  type: EnvironmentType;
}

export function EnvironmentIcon({ type }: Props) {
  switch (type) {
    case EnvironmentType.EdgeAgentOnDocker:
      return (
        <img src={dockerEdge} alt="docker edge endpoint" aria-hidden="true" />
      );
    case EnvironmentType.KubernetesLocal:
    case EnvironmentType.AgentOnKubernetes:
      return <img src={kube} alt="kubernetes endpoint" aria-hidden="true" />;
    case EnvironmentType.EdgeAgentOnKubernetes:
      return (
        <img src={kubeEdge} alt="kubernetes edge endpoint" aria-hidden="true" />
      );
    default:
      return (
        <i
          className={clsx('fa-4x', 'blue-icon', environmentTypeIcon(type))}
          aria-hidden="true"
        />
      );
  }
}
