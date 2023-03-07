export interface AnalyticsState {
  dockerAgent: number;
  dockerApi: number;
  dockerEdgeAgentStandard: number;
  dockerEdgeAgentAsync: number;
  kubernetesAgent: number;
  kubernetesEdgeAgentStandard: number;
  kubernetesEdgeAgentAsync: number;
  kaasAgent: number;
  aciApi: number;
  localEndpoint: number;
  nomadEdgeAgentStandard: number;
}

export type AnalyticsStateKey = keyof AnalyticsState;
