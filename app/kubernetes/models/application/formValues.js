import { KubernetesApplicationDeploymentTypes, KubernetesApplicationPublishingTypes } from "./models";

/**
 * KubernetesApplicationFormValues Model
 */
const _KubernetesApplicationFormValues = Object.freeze({
  ResourcePool: '',
  Name: '',
  StackName: '',
  Image: '',
  ReplicaCount: 1,
  EnvironmentVariables: [],
  PersistedFolders: [],
  PublishedPorts: [],
  MemoryLimit: 0,
  CpuLimit: 0,
  DeploymentType: KubernetesApplicationDeploymentTypes.REPLICATED,
  PublishingType: KubernetesApplicationPublishingTypes.INTERNAL
});

export class KubernetesApplicationFormValues {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationFormValues)));
  }
}

/**
 * KubernetesApplicationEnvironmentVariableFormValue Model
 */
const _KubernetesApplicationEnvironmentVariableFormValue = Object.freeze({
  Name: '',
  Value: '',
  IsSecret: false
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
  ContainerPath: '',
  Size: '',
  StorageClass: {}
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
const _KubernetesApplicationPublishedPortFormValue = Object.freeze({
  ContainerPort: '',
    NodePort: '',
    LoadBalancerPort: '',
    Protocol: 'TCP'
});

export class KubernetesApplicationPublishedPortFormValue {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPublishedPortFormValue)));
  }
}
