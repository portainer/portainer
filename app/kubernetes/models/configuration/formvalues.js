import { KubernetesConfigurationTypes } from './models';

/**
 * KubernetesConfigurationFormValues Model
 */
const _KubernetesConfigurationFormValues = Object.freeze({
  Id: '',
  ResourcePool: '',
  Name: '',
  ConfigurationOwner: '',
  Type: KubernetesConfigurationTypes.CONFIGMAP,
  Data: [],
  DataYaml: '',
  IsSimple: true,
});

export class KubernetesConfigurationFormValues {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesConfigurationFormValues)));
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
