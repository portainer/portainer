import { Registry } from '@/react/portainer/registries/types/registry';

import { IngressControllerClassMap } from '../../cluster/ingressClass/types';
import {
  ResourceQuotaFormValues,
  ResourceQuotaPayload,
} from '../components/NamespaceForm/ResourceQuotaFormSection/types';

export type CreateNamespaceFormValues = {
  name: string;
  resourceQuota: ResourceQuotaFormValues;
  ingressClasses: IngressControllerClassMap[];
  registries: Registry[];
};

export type CreateNamespacePayload = {
  Name: string;
  Owner: string;
  ResourceQuota: ResourceQuotaPayload;
};

export type UpdateRegistryPayload = {
  Id: number;
  Namespaces: string[];
};
