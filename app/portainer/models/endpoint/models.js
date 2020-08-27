/**
 * JS reference of portainer.go#EndpointType iota
 */
export const PortainerEndpointTypes = Object.freeze({
  // DockerEnvironment represents an endpoint connected to a Docker environment
  DockerEnvironment: 1,
  // AgentOnDockerEnvironment represents an endpoint connected to a Portainer agent deployed on a Docker environment
  AgentOnDockerEnvironment: 2,
  // AzureEnvironment represents an endpoint connected to an Azure environment
  AzureEnvironment: 3,
  // EdgeAgentOnDockerEnvironment represents an endpoint connected to an Edge agent deployed on a Docker environment
  EdgeAgentOnDockerEnvironment: 4,
  // KubernetesLocalEnvironment represents an endpoint connected to a local Kubernetes environment
  KubernetesLocalEnvironment: 5,
  // AgentOnKubernetesEnvironment represents an endpoint connected to a Portainer agent deployed on a Kubernetes environment
  AgentOnKubernetesEnvironment: 6,
  // EdgeAgentOnKubernetesEnvironment represents an endpoint connected to an Edge agent deployed on a Kubernetes environment
  EdgeAgentOnKubernetesEnvironment: 7,
});

/**
 * JS reference of endpoint_create.go#EndpointCreationType iota
 */
export const PortainerEndpointCreationTypes = Object.freeze({
  LocalDockerEnvironment: 1,
  AgentEnvironment: 2,
  AzureEnvironment: 3,
  EdgeAgentEnvironment: 4,
  LocalKubernetesEnvironment: 5,
});

export const PortainerEndpointConnectionTypes = Object.freeze({
  DOCKER_LOCAL: 1,
  KUBERNETES_LOCAL: 2,
  REMOTE: 3,
  AZURE: 4,
  AGENT: 5,
  EDGE: 6,
});
