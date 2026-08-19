import { ReactNode } from 'react';

export interface ServicePort {
  port: number;
  targetPort?: number;
  nodePort?: number;
  serviceName?: string;
  name?: string;
  protocol?: string;
  ingressPaths?: ServicePortIngressPath[];
}

export type ServicePortIngressPath = {
  IngressName?: string;
  Host?: string;
  Path?: string;
};

export type ServiceFormValues = {
  Headless: boolean;
  Ports: ServicePort[];
  Type: ServiceType;
  Ingress: boolean;
  ClusterIP?: string;
  ApplicationName?: string;
  ApplicationOwner?: string;
  Note?: string;
  Name?: string;
  StackName?: string;
  Selector?: Record<string, string>;
  Namespace?: string;
};

export type ServiceType = 'ClusterIP' | 'NodePort' | 'LoadBalancer';
export type ServiceTypeOption = {
  value: ServiceType;
  label: ReactNode;
};

export type IngressOption = {
  label: string;
  value: string;
  ingressName: string;
};
