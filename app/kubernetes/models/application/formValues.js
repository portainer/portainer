import { KubernetesApplicationDataAccessPolicies, KubernetesApplicationDeploymentTypes, KubernetesApplicationPublishingTypes, KubernetesApplicationPlacementTypes } from './models';

/**
 * KubernetesApplicationFormValues Model
 */
const _KubernetesApplicationFormValues = Object.freeze({
  ApplicationType: undefined, // will only exist for formValues generated from Application (app edit situation)
  ResourcePool: {},
  Name: '',
  StackName: '',
  ApplicationOwner: '',
  Image: '',
  Note: '',
  MemoryLimit: 0,
  CpuLimit: 0,
  DeploymentType: KubernetesApplicationDeploymentTypes.REPLICATED,
  ReplicaCount: 1,
  AutoScaler: {},
  Containers: [],
  EnvironmentVariables: [], // KubernetesApplicationEnvironmentVariableFormValue list
  DataAccessPolicy: KubernetesApplicationDataAccessPolicies.SHARED,
  PersistedFolders: [], // KubernetesApplicationPersistedFolderFormValue list
  Configurations: [], // KubernetesApplicationConfigurationFormValue list
  PublishingType: KubernetesApplicationPublishingTypes.INTERNAL,
  PublishedPorts: [], // KubernetesApplicationPublishedPortFormValue list
  PlacementType: KubernetesApplicationPlacementTypes.PREFERRED,
  Placements: [], // KubernetesApplicationPlacementFormValue list
  OriginalIngresses: undefined,
});

export class KubernetesApplicationFormValues {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationFormValues)));
  }
}

export const KubernetesApplicationConfigurationFormValueOverridenKeyTypes = Object.freeze({
  NONE: 0,
  ENVIRONMENT: 1,
  FILESYSTEM: 2,
});

/**
 * KubernetesApplicationConfigurationFormValueOverridenKey Model
 */
const _KubernetesApplicationConfigurationFormValueOverridenKey = Object.freeze({
  Key: '',
  Path: '',
  Type: KubernetesApplicationConfigurationFormValueOverridenKeyTypes.ENVIRONMENT,
});

export class KubernetesApplicationConfigurationFormValueOverridenKey {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationConfigurationFormValueOverridenKey)));
  }
}

/**
 * KubernetesApplicationConfigurationFormValue Model
 */
const _KubernetesApplicationConfigurationFormValue = Object.freeze({
  SelectedConfiguration: undefined,
  Overriden: false,
  OverridenKeys: [], // KubernetesApplicationConfigurationFormValueOverridenKey list
});

export class KubernetesApplicationConfigurationFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationConfigurationFormValue)));
  }
}

/**
 * KubernetesApplicationEnvironmentVariableFormValue Model
 */
const _KubernetesApplicationEnvironmentVariableFormValue = Object.freeze({
  Name: '',
  Value: '',
  IsSecret: false,
  NeedsDeletion: false,
  IsNew: true,
});

export class KubernetesApplicationEnvironmentVariableFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationEnvironmentVariableFormValue)));
  }
}

/**
 * KubernetesApplicationPersistedFolderFormValue Model
 */
const _KubernetesApplicationPersistedFolderFormValue = Object.freeze({
  PersistentVolumeClaimName: '', // will be empty for new volumes (create/edit app) and filled for existing ones (edit)
  NeedsDeletion: false,
  ContainerPath: '',
  Size: '',
  SizeUnit: 'GB',
  StorageClass: {},
  ExistingVolume: null,
  UseNewVolume: true,
});

export class KubernetesApplicationPersistedFolderFormValue {
  constructor(storageClass) {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPersistedFolderFormValue)));
    this.StorageClass = storageClass;
  }
}

/**
 * KubernetesApplicationPublishedPortFormValue Model
 */
export function KubernetesApplicationPublishedPortFormValue() {
  return {
    NeedsDeletion: false,
    IsNew: true,
    ContainerPort: '',
    NodePort: '',
    LoadBalancerPort: '',
    LoadBalancerNodePort: undefined, // only filled to save existing loadbalancer nodePort and drop it when moving app exposure from LB to Internal/NodePort
    Protocol: 'TCP',
    IngressName: undefined,
    IngressRoute: undefined,
    IngressHost: undefined,
  };
}

export function KubernetesApplicationPlacementFormValue() {
  return {
    Label: {},
    Value: '',
    NeedsDeletion: false,
    IsNew: true,
  };
}

/**
 * KubernetesApplicationAutoScalerFormValue Model
 */
const _KubernetesApplicationAutoScalerFormValue = Object.freeze({
  MinReplicas: 0,
  MaxReplicas: 0,
  TargetCPUUtilization: 50,
  ApiVersion: '',
  IsUsed: false,
});

export class KubernetesApplicationAutoScalerFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationAutoScalerFormValue)));
  }
}

export function KubernetesFormValidationReferences() {
  return {
    refs: {},
    hasRefs: false,
  };
}
