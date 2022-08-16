export interface AnalyticsState {
  dockerAgent: number;
  dockerApi: number;
  dockerEdgeAgent: number;
  kubernetesAgent: number;
  kubernetesEdgeAgent: number;
  kaasAgent: number;
  aciApi: number;
  localEndpoint: number;
  nomadEdgeAgent: number;
}

export type AnalyticsStateKey = keyof AnalyticsState;
