import { KubernetesConfigurationKinds } from './models';

/**
 * KubernetesConfigurationFormValues Model
 */
const _KubernetesConfigurationFormValues = Object.freeze({
  Id: '',
  ResourcePool: '',
  Name: '',
  ConfigurationOwner: '',
  Type: KubernetesConfigurationKinds.CONFIGMAP,
  Data: [],
  DataYaml: '',
  IsSimple: true,
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
    Object.assign(this, _KubernetesConfigurationFormValuesEntry);
  }
}
