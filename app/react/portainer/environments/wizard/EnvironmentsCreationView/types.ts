export interface AnalyticsState {
  dockerAgent: number;
  dockerApi: number;
  dockerEdgeAgentStandard: number;
  dockerEdgeAgentAsync: number;
  podmanAgent: number;
  podmanApi: number;
  podmanEdgeAgentStandard: number;
  podmanEdgeAgentAsync: number;
  podmanLocalEnvironment: number; // podman socket
  kubernetesAgent: number;
  kubernetesEdgeAgentStandard: number;
  kubernetesEdgeAgentAsync: number;
  kaasAgent: number;
  aciApi: number;
  localEndpoint: number;
}

export type AnalyticsStateKey = keyof AnalyticsState;
