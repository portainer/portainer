import { IngressControllerClassMap } from '../../ingressClass/types';

export type AccessMode = {
  Description: string;
  Name: string;
  selected: boolean;
};

export type StorageClassFormValues = {
  Name: string;
  AccessModes: AccessMode[];
  Provisioner: string;
  AllowVolumeExpansion: boolean;
  selected: boolean;
};

export type ConfigureFormValues = {
  useLoadBalancer: boolean;
  useServerMetrics: boolean;
  enableResourceOverCommit: boolean;
  resourceOverCommitPercentage: number;
  restrictDefaultNamespace: boolean;
  restrictStandardUserIngressW: boolean;
  ingressAvailabilityPerNamespace: boolean;
  allowNoneIngressClass: boolean;
  storageClasses: StorageClassFormValues[];
  ingressClasses: IngressControllerClassMap[];
};
