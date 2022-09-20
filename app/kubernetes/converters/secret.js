import _ from 'lodash-es';
import { KubernetesSecretCreatePayload, KubernetesSecretUpdatePayload } from 'Kubernetes/models/secret/payloads';
import { KubernetesApplicationSecret } from 'Kubernetes/models/secret/models';
import { KubernetesPortainerConfigurationDataAnnotation } from 'Kubernetes/models/configuration/models';
import { KubernetesPortainerConfigurationOwnerLabel } from 'Kubernetes/models/configuration/models';
import { KubernetesConfigurationFormValuesEntry } from 'Kubernetes/models/configuration/formvalues';
import { KubernetesSecretTypes } from 'Kubernetes/models/configuration/models';
class KubernetesSecretConverter {
  static createPayload(secret) {
    const res = new KubernetesSecretCreatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.type = secret.Type.value;
    const configurationOwner = _.truncate(secret.ConfigurationOwner, { length: 63, omission: '' });
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = configurationOwner;

    let annotation = '';
    _.forEach(secret.Data, (entry) => {
      if (entry.IsBinary) {
        res.data[entry.Key] = entry.Value;
        annotation += annotation !== '' ? '|' + entry.Key : entry.Key;
      } else {
        res.stringData[entry.Key] = entry.Value;
      }
    });
    if (annotation !== '') {
      res.metadata.annotations[KubernetesPortainerConfigurationDataAnnotation] = annotation;
    }

    _.forEach(secret.Annotations, (entry) => {
      res.metadata.annotations[entry.name] = entry.value;
    });

    return res;
  }

  static updatePayload(secret) {
    const res = new KubernetesSecretUpdatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.type = secret.Type;
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = secret.ConfigurationOwner;

    let annotation = '';
    _.forEach(secret.Data, (entry) => {
      if (entry.IsBinary) {
        res.data[entry.Key] = entry.Value;
        annotation += annotation !== '' ? '|' + entry.Key : entry.Key;
      } else {
        res.stringData[entry.Key] = entry.Value;
      }
    });
    if (annotation !== '') {
      res.metadata.annotations[KubernetesPortainerConfigurationDataAnnotation] = annotation;
    }
    return res;
  }

  static apiToSecret(payload, yaml) {
    const res = new KubernetesApplicationSecret();
    res.Id = payload.metadata.uid;
    res.Name = payload.metadata.name;
    res.Namespace = payload.metadata.namespace;
    res.Type = payload.type;
    res.ConfigurationOwner = payload.metadata.labels ? payload.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] : '';
    res.CreationDate = payload.metadata.creationTimestamp;

    res.IsRegistrySecret = payload.metadata.annotations && !!payload.metadata.annotations['portainer.io/registry.id'];

    res.Yaml = yaml ? yaml.data : '';

    res.SecretType = payload.type;

    res.Data = _.map(payload.data, (value, key) => {
      const annotations = payload.metadata.annotations ? payload.metadata.annotations[KubernetesPortainerConfigurationDataAnnotation] : '';
      const entry = new KubernetesConfigurationFormValuesEntry();
      entry.Key = key;
      entry.IsBinary = _.includes(annotations, entry.Key);

      if (!entry.IsBinary) {
        entry.Value = atob(value);
      } else {
        entry.Value = value;
      }
      return entry;
    });

    return res;
  }

  static configurationFormValuesToSecret(formValues) {
    const res = new KubernetesApplicationSecret();
    res.Name = formValues.Name;
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Type = formValues.Type;
    res.ConfigurationOwner = formValues.ConfigurationOwner;
    res.Data = formValues.Data;

    switch (formValues.Type) {
      case KubernetesSecretTypes.CUSTOM:
        res.Type.value = formValues.customType;
        break;

      case KubernetesSecretTypes.SERVICEACCOUNTTOKEN:
        res.Annotations = [{ name: 'kubernetes.io/service-account.name', value: formValues.ServiceAccountName }];
        break;
    }
    return res;
  }
}

export default KubernetesSecretConverter;
