export interface Port {
  Name: string;
  Protocol: string;
  Port: number;
  TargetPort: number;
  NodePort?: number;
}

export interface IngressIP {
  IP: string;
}

export interface LoadBalancer {
  Ingress: IngressIP[];
}

export interface Status {
  LoadBalancer: LoadBalancer;
}

export interface Service {
  Annotations?: Document;
  CreationTimestamp?: string;
  Labels?: Document;
  Name: string;
  Namespace: string;
  UID: string;
  AllocateLoadBalancerNodePorts?: boolean;
  Ports: Port[];
  Selector?: Document;
  Type: string;
  Status?: Status;
}
