import { ReactNode } from 'react';

import { Option } from '@@/form-components/Input/Select';

import { Annotation, AnnotationErrors } from '../../annotations/types';

export interface Path {
  Key: string;
  Route: string;
  ServiceName: string;
  ServicePort: number;
  PathType?: string;
}

export interface Host {
  Key: string;
  Host: string;
  Secret: string;
  Paths: Path[];
  NoHost?: boolean;
}

export interface Rule {
  Key: string;
  IngressName: string;
  Namespace: string;
  IngressClassName: string;
  Hosts: Host[];
  Annotations?: Annotation[];
  IngressType?: string;
  Labels?: Record<string, string>;
}

export interface ServicePorts {
  [serviceName: string]: Option<string>[];
}

interface ServiceOption extends Option<string> {
  selectedLabel: string;
}

export type GroupedServiceOptions = {
  label: string;
  options: ServiceOption[];
}[];

export type IngressErrors = Record<string, ReactNode> & {
  annotations?: AnnotationErrors;
};
