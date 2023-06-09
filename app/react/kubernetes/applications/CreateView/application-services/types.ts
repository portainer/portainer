import { ReactNode } from 'react';

export interface ServicePort {
  port?: number;
  targetPort?: number;
  nodePort?: number;
  serviceName?: string;
  name?: string;
  protocol?: string;
  ingress?: object;
}

export type ServiceTypeAngularEnum = 1 | 2 | 3; // ClusterIP | NodePort | LoadBalancer

export type ServiceFormValues = {
  Headless: boolean;
  Ports: ServicePort[];
  Type: ServiceTypeAngularEnum;
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

export type ServiceTypeValue = 'ClusterIP' | 'NodePort' | 'LoadBalancer';
export type ServiceTypeOption = {
  value: ServiceTypeValue;
  label: ReactNode;
};
