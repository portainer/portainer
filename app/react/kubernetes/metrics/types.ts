export type NodeMetrics = {
  items: NodeMetric[];
};

export type NodeMetric = {
  metadata: NodeMetricMetadata;
  timestamp: Date;
  usage: Usage;
  window: string;
};

export type NodeMetricMetadata = {
  creationTimestamp: Date;
  name: string;
};

export type Usage = {
  cpu: string;
  memory: string;
};

export type ApplicationResource = {
  cpuRequest: number;
  cpuLimit: number;
  memoryRequest: number;
  memoryLimit: number;
};
