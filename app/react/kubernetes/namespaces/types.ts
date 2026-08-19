import { NamespaceStatus, ResourceQuota } from 'kubernetes-types/core/v1';

import { Registry } from '@/react/portainer/registries/types/registry';

import { IngressControllerClassMap } from '../cluster/ingressClass/types';

import { ResourceQuotaFormValues } from './components/NamespaceForm/ResourceQuotaFormSection/types';

export interface PortainerNamespace {
  Id: string;
  Name: string;
  Status: NamespaceStatus;
  UnhealthyEventCount: number;
  Annotations: Record<string, string> | null;
  CreationDate: string;
  NamespaceOwner: string;
  IsSystem: boolean;
  IsDefault: boolean;
  ResourceQuota?: ResourceQuota | null;
}

// type returned via the internal portainer namespaces api, with simplified fields
// it is a record currently (legacy reasons), but it should be an array
export type Namespaces = Record<string, PortainerNamespace>;

export type NamespaceFormValues = {
  name: string;
  resourceQuota: ResourceQuotaFormValues;
  ingressClasses: IngressControllerClassMap[];
  registries: Registry[];
};

export type NamespacePayload = {
  Name: string;
  Owner: string;
  ResourceQuota: ResourceQuotaFormValues;
};

export type UpdateRegistryPayload = {
  Id: number;
  Namespaces: string[];
};
