import { PorImageRegistryModel } from '@/docker/models/porImageRegistry';
import { KubernetesApplicationTypes, KubernetesApplicationDeploymentTypes, KubernetesApplicationDataAccessPolicies } from 'Kubernetes/models/application/models/appConstants';

/**
 * KubernetesApplicationFormValues Model
 */
export function KubernetesApplicationFormValues() {
  this.ApplicationType = KubernetesApplicationTypes.Deployment; // will only exist for formValues generated from Application (app edit situation;
  this.ResourcePool = {};
  this.Name = '';
  this.StackName = '';
  this.ApplicationOwner = '';
  this.ImageModel = new PorImageRegistryModel();
  this.Note = '';
  this.MemoryLimit = 0;
  this.CpuLimit = 0;
  this.DeploymentType = KubernetesApplicationDeploymentTypes.Replicated;
  this.ReplicaCount = 1;
  this.AutoScaler = {};
  this.Containers = [];
  this.Services = [];
  this.EnvironmentVariables = []; // KubernetesApplicationEnvironmentVariableFormValue lis;
  this.DataAccessPolicy = KubernetesApplicationDataAccessPolicies.Isolated;
  this.PersistedFolders = []; // KubernetesApplicationPersistedFolderFormValue lis;
  this.ConfigMaps = [];
  this.Secrets = [];
  this.PublishedPorts = []; // KubernetesApplicationPublishedPortFormValue lis;
  this.PlacementType = 'preferred';
  this.Placements = []; // KubernetesApplicationPlacementFormValue lis;
  this.OriginalIngresses = undefined;
}

/**
 * KubernetesApplicationConfigurationFormValueOverridenKey Model
 */
const _KubernetesApplicationConfigurationFormValueOverridenKey = Object.freeze({
  key: '',
  path: '',
  type: 'ENVIRONMENT',
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
  selectedConfiguration: undefined,
  overriden: false,
  overridenKeys: [],
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
  name: '',
  value: '',
  needsDeletion: false,
  isNew: true,
  nameIndex: '', // keep the original name for sorting
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
  persistentVolumeClaimName: '', // will be empty for new volumes (create/edit app) and filled for existing ones (edit)
  needsDeletion: false,
  containerPath: '',
  size: '',
  sizeUnit: 'GB',
  storageClass: {},
  existingVolume: null,
  useNewVolume: true,
});

export class KubernetesApplicationPersistedFolderFormValue {
  constructor(storageClass) {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPersistedFolderFormValue)));
    this.storageClass = storageClass;
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
    IngressHosts: [],
  };
}

export function KubernetesApplicationPlacementFormValue() {
  return {
    label: {},
    value: '',
    needsDeletion: false,
    isNew: true,
  };
}

/**
 * KubernetesApplicationAutoScalerFormValue Model
 */
const _KubernetesApplicationAutoScalerFormValue = Object.freeze({
  minReplicas: 0,
  maxReplicas: 0,
  targetCpuUtilizationPercentage: 50,
  apiVersion: '',
  isUsed: false,
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
