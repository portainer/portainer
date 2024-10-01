import { NamespaceStatus, ResourceQuota } from 'kubernetes-types/core/v1';

export interface PortainerNamespace {
  Id: string;
  Name: string;
  Status: NamespaceStatus;
  CreationDate: number;
  NamespaceOwner: string;
  IsSystem: boolean;
  IsDefault: boolean;
  ResourceQuota?: ResourceQuota | null;
}

// type returned via the internal portainer namespaces api, with simplified fields
// it is a record currently (legacy reasons), but it should be an array
export type Namespaces = Record<string, PortainerNamespace>;
