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
  uid: string;
  name: string;
  kind: string;
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
  CreationDate: string;
  Applications?: Application[];

  IsSystem: boolean;
};
