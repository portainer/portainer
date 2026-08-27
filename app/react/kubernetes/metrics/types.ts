export type PodMetrics = {
  items?: PodMetric[];
};

export type PodMetric = {
  containers: ContainerMetric[];
};

type ContainerMetric = {
  usage: ResourceUsage;
};

type ResourceUsage = {
  cpu: string;
  memory: string;
};

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

export type SinglePodMetric = {
  timestamp?: string;
  containers?: PodContainerMetric[];
};

export type PodContainerMetric = {
  name: string;
  usage: ResourceUsage;
};

export type ApplicationResource = {
  CpuRequest: number;
  CpuLimit: number;
  MemoryRequest: number;
  MemoryLimit: number;
};
