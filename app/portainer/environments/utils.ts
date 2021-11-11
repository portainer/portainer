import { EnvironmentType, PlatformType } from './types';

export function getPlatformType(envType: EnvironmentType) {
  switch (envType) {
    case EnvironmentType.KubernetesLocal:
    case EnvironmentType.AgentOnKubernetes:
    case EnvironmentType.EdgeAgentOnKubernetes:
      return PlatformType.Kubernetes;
    case EnvironmentType.Docker:
    case EnvironmentType.AgentOnDocker:
    case EnvironmentType.EdgeAgentOnDocker:
      return PlatformType.Docker;
    case EnvironmentType.Azure:
      return PlatformType.Azure;
    default:
      throw new Error(`Environment Type ${envType} is not supported`);
  }
}

export function isDockerEnvironment(envType: EnvironmentType) {
  return getPlatformType(envType) === PlatformType.Docker;
}

export function isKubernetesEnvironment(envType: EnvironmentType) {
  return getPlatformType(envType) === PlatformType.Kubernetes;
}

export function isEdgeEnvironment(envType: EnvironmentType) {
  return [
    EnvironmentType.EdgeAgentOnDocker,
    EnvironmentType.EdgeAgentOnKubernetes,
  ].includes(envType);
}
