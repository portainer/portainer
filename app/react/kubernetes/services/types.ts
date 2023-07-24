type ServicePort = {
  Name: string;
  NodePort: number;
  Port: number;
  Protocol: string;
  TargetPort: string;
};

type IngressStatus = {
  Hostname: string;
  IP: string;
};

type Application = {
  UID: string;
  Name: string;
  Type: string;
};

export type ServiceType =
  | 'ClusterIP'
  | 'ExternalName'
  | 'NodePort'
  | 'LoadBalancer';

export type Service = {
  Name: string;
  UID: string;
  Namespace: string;
  Annotations?: Record<string, string>;
  Labels?: Record<string, string>;
  Type: ServiceType;
  Ports: Array<ServicePort>;
  Selector?: Record<string, string>;
  ClusterIPs?: Array<string>;
  IngressStatus?: Array<IngressStatus>;
  ExternalName?: string;
  ExternalIPs?: Array<string>;
  CreationTimestamp: string;
  Applications?: Application[];
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
