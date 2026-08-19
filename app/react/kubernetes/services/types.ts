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
  Uid: string;
  Name: string;
  Kind: string;
};

export type ServiceType =
  | 'ClusterIP'
  | 'ExternalName'
  | 'NodePort'
  | 'LoadBalancer';

export type Service = {
  Name: string;
  UID: string;
  Type: ServiceType;
  Namespace: string;
  Annotations?: Record<string, string>;
  CreationDate: string;
  Labels?: Record<string, string>;
  AllocateLoadBalancerNodePorts?: boolean;
  Ports?: Array<ServicePort>;
  Selector?: Record<string, string>;
  IngressStatus?: Array<IngressStatus>;
  Applications?: Application[];
  ClusterIPs?: Array<string>;
  ExternalName?: string;
  ExternalIPs?: Array<string>;
};
