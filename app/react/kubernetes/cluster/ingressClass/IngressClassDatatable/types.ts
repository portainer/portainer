import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@/react/components/datatables/types';

export interface TableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export type SupportedIngControllerTypes =
  | 'nginx'
  | 'traefik'
  | 'other'
  | 'custom';

// Not having 'extends Record<string, unknown>' fixes validation type errors from yup
export interface IngressControllerClassMap {
  Name: string;
  ClassName: string;
  Type: string;
  Availability: boolean;
  New: boolean;
  Used: boolean; // if the controller is used by any ingress in the cluster
}

// Record<string, unknown> fixes type errors when using the type with a react datatable
export interface IngressControllerClassMapRowData
  extends Record<string, unknown>,
    IngressControllerClassMap {}
