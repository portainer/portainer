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

export type Service = {
  Name: string;
  UID: string;
  Namespace: string;
  Annotations?: Record<string, string>;
  Labels?: Record<string, string>;
  Type: 'ClusterIP' | 'ExternalName' | 'NodePort' | 'LoadBalancer' | string;
  Ports: Array<ServicePort>;
  Selector?: Record<string, string>;
  ClusterIPs?: Array<string>;
  IngressStatus?: Array<IngressStatus>;
  ExternalName?: string;
  CreationTimestamp: string;
  Applications?: Application[];
};
