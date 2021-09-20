import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

export default class {
  $onInit() {
    const secrets = (this.configurations || [])
      .filter((config) => config.Data && config.Type === KubernetesConfigurationTypes.SECRET)
      .flatMap((config) => Object.entries(config.Data))
      .map(([key, value]) => ({ key, value }));

    this.state = { secrets };
  }
}
