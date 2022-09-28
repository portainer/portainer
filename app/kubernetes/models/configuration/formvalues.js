import { KubernetesConfigurationKinds, KubernetesSecretTypeOptions } from './models';

/**
 * KubernetesConfigurationFormValues Model
 */
const _KubernetesConfigurationFormValues = Object.freeze({
  Id: '',
  ResourcePool: '',
  Name: '',
  ConfigurationOwner: '',
  Kind: KubernetesConfigurationKinds.CONFIGMAP,
  Data: [],
  DataYaml: '',
  IsSimple: true,
  ServiceAccountName: '',
  Type: KubernetesSecretTypeOptions.OPAQUE.value,
});

export class KubernetesConfigurationFormValues {
  constructor() {
    Object.assign(this, _KubernetesConfigurationFormValues);
  }
}

const _KubernetesConfigurationFormValuesEntry = Object.freeze({
  Key: '',
  Value: '',
  IsBinary: false,
});

export class KubernetesConfigurationFormValuesEntry {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfigurationFormValuesEntry)));
  }
}
