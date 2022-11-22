import { KubernetesConfigurationKinds } from 'Kubernetes/models/configuration/models';

export default class {
  $onInit() {
    const secrets = (this.configurations || [])
      .filter((config) => config.Data && config.Kind === KubernetesConfigurationKinds.SECRET)
      .flatMap((config) => Object.entries(config.Data))
      .map(([key, value]) => ({ key, value }));

    this.state = { secrets };
  }
}
