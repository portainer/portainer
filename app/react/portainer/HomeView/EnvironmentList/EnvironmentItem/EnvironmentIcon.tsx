import { environmentTypeIcon } from '@/portainer/filters/filters';
import dockerEdge from '@/assets/images/edge_endpoint.png';
import kube from '@/assets/images/kubernetes_endpoint.png';
import kubeEdge from '@/assets/images/kubernetes_edge_endpoint.png';
import { EnvironmentType } from '@/react/portainer/environments/types';
import azure from '@/assets/ico/vendor/azure.svg';
import docker from '@/assets/ico/vendor/docker.svg';

import { Icon } from '@@/Icon';

interface Props {
  type: EnvironmentType;
}

export function EnvironmentIcon({ type }: Props) {
  switch (type) {
    case EnvironmentType.AgentOnDocker:
    case EnvironmentType.Docker:
      return (
        <img src={docker} width="60" alt="docker endpoint" aria-hidden="true" />
      );
    case EnvironmentType.Azure:
      return (
        <img src={azure} width="60" alt="azure endpoint" aria-hidden="true" />
      );
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
        <Icon
          icon={environmentTypeIcon(type)}
          className="blue-icon !h-16 !w-16"
        />
      );
  }
}
