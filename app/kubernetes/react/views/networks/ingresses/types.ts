import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@/react/components/datatables/types';
import { SupportedIngControllerTypes } from '@/react/kubernetes/cluster/ingressClass/types';

export interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export interface Path {
  IngressName: string;
  ServiceName: string;
  Host: string;
  Port: number;
  Path: string;
  PathType: string;
  HasService?: boolean;
}

export interface TLS {
  Hosts: string[];
  SecretName: string;
}

export type Ingress = {
  Name: string;
  UID?: string;
  Namespace: string;
  ClassName: string;
  Annotations?: Record<string, string>;
  Hosts?: string[];
  Paths: Path[];
  TLS?: TLS[];
  Type?: string;
};

export interface DeleteIngressesRequest {
  [key: string]: string[];
}

export interface IngressController {
  Name: string;
  ClassName: string;
  Availability: string;
  Type: SupportedIngControllerTypes;
  New: boolean;
}
