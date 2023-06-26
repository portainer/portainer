import { Environment, EnvironmentType, PlatformType } from '../types';

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
    case EnvironmentType.EdgeAgentOnNomad:
      return PlatformType.Nomad;
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

export function getPlatformTypeName(envType: EnvironmentType): string {
  return PlatformType[getPlatformType(envType)];
}

export function isNomadEnvironment(envType: EnvironmentType) {
  return getPlatformType(envType) === PlatformType.Nomad;
}

export function isAgentEnvironment(envType: EnvironmentType) {
  return (
    isEdgeEnvironment(envType) ||
    [EnvironmentType.AgentOnDocker, EnvironmentType.AgentOnKubernetes].includes(
      envType
    )
  );
}

export function isEdgeEnvironment(envType: EnvironmentType) {
  return [
    EnvironmentType.EdgeAgentOnDocker,
    EnvironmentType.EdgeAgentOnKubernetes,
  ].includes(envType);
}

export function isEdgeAsync(env?: Environment | null) {
  return !!env && env.Edge.AsyncMode;
}

export function isUnassociatedEdgeEnvironment(env: Environment) {
  return isEdgeEnvironment(env.Type) && !env.EdgeID;
}

export function isLocalEnvironment(environment: Environment) {
  return (
    environment.URL.includes('unix://') ||
    environment.URL.includes('npipe://') ||
    environment.Type === EnvironmentType.KubernetesLocal
  );
}

export function isDockerAPIEnvironment(environment: Environment) {
  return (
    environment.URL.startsWith('tcp://') &&
    environment.Type === EnvironmentType.Docker
  );
}

export function getDashboardRoute(environment: Environment) {
  if (isEdgeEnvironment(environment.Type)) {
    if (!environment.EdgeID) {
      return {
        to: 'portainer.endpoints.endpoint',
        params: { id: environment.Id },
      };
    }

    if (isEdgeAsync(environment)) {
      return {
        to: 'edge.browse.dashboard',
        params: { environmentId: environment.Id },
      };
    }
  }

  const params = { endpointId: environment.Id };
  const to = getPlatformRoute();

  return { to, params };

  function getPlatformRoute() {
    const platform = getPlatformType(environment.Type);
    switch (platform) {
      case PlatformType.Azure:
        return 'azure.dashboard';
      case PlatformType.Docker:
        return 'docker.dashboard';
      case PlatformType.Kubernetes:
        return 'kubernetes.dashboard';
      case PlatformType.Nomad:
        return 'nomad.dashboard';
      default:
        throw new Error(`Unsupported platform ${platform}`);
    }
  }
}
