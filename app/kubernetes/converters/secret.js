import { KubernetesSecretCreatePayload, KubernetesSecretUpdatePayload } from 'Kubernetes/models/secret/payloads';
import { KubernetesApplicationSecret } from 'Kubernetes/models/secret/models';
import YAML from 'yaml';
import _ from 'lodash-es';
import { KubernetesPortainerConfigurationOwnerLabel } from 'Kubernetes/models/configuration/models';

class KubernetesSecretConverter {
  static createPayload(secret) {
    const res = new KubernetesSecretCreatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = secret.ConfigurationOwner;
    res.stringData = secret.Data;
    return res;
  }

  static updatePayload(secret) {
    const res = new KubernetesSecretUpdatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = secret.ConfigurationOwner;
    res.stringData = secret.Data;
    return res;
  }

  static apiToSecret(payload, yaml) {
    const res = new KubernetesApplicationSecret();
    res.Id = payload.metadata.uid;
    res.Name = payload.metadata.name;
    res.Namespace = payload.metadata.namespace;
    res.ConfigurationOwner = payload.metadata.labels ? payload.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] : '';
    res.CreationDate = payload.metadata.creationTimestamp;
    res.Yaml = yaml ? yaml.data : '';
    res.Data = payload.data;
    return res;
  }

  static configurationFormValuesToSecret(formValues) {
    const res = new KubernetesApplicationSecret();
    res.Name = formValues.Name;
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.ConfigurationOwner = formValues.ConfigurationOwner;
    if (formValues.IsSimple) {
      res.Data = _.reduce(
        formValues.Data,
        (acc, entry) => {
          acc[entry.Key] = entry.Value;
          return acc;
        },
        {}
      );
    } else {
      res.Data = YAML.parse(formValues.DataYaml);
    }
    return res;
  }
}

export default KubernetesSecretConverter;
