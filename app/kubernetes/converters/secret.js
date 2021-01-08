import { KubernetesSecretCreatePayload, KubernetesSecretUpdatePayload } from 'Kubernetes/models/secret/payloads';
import { KubernetesApplicationSecret } from 'Kubernetes/models/secret/models';
import YAML from 'yaml';
import _ from 'lodash-es';
import chardet from 'chardet';
import { Base64 } from 'js-base64';
import { KubernetesPortainerConfigurationOwnerLabel } from 'Kubernetes/models/configuration/models';

class KubernetesSecretConverter {
  static createPayload(secret) {
    const res = new KubernetesSecretCreatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    const configurationOwner = _.truncate(secret.configurationOwner, { length: 63, omission: '' });
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = configurationOwner;
    res.stringData = secret.Data;
    res.data = secret.BinaryData;
    return res;
  }

  static updatePayload(secret) {
    const res = new KubernetesSecretUpdatePayload();
    res.metadata.name = secret.Name;
    res.metadata.namespace = secret.Namespace;
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = secret.ConfigurationOwner;
    res.stringData = secret.Data;
    res.data = secret.BinaryData;
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

    _.forEach(payload.data, (value, key) => {
      const encoding = chardet.detect(Buffer.from(Base64.decode(value)));
      if (_.includes(encoding, 'ISO') || _.includes(encoding, 'UTF-8')) {
        res.Data[key] = value;
      } else {
        res.BinaryData[key] = value;
      }
    });
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
