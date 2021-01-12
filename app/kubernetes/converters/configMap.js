import _ from 'lodash-es';
import YAML from 'yaml';
import { KubernetesConfigMap } from 'Kubernetes/models/config-map/models';
import { KubernetesConfigMapCreatePayload, KubernetesConfigMapUpdatePayload } from 'Kubernetes/models/config-map/payloads';
import { KubernetesPortainerConfigurationOwnerLabel } from 'Kubernetes/models/configuration/models';

class KubernetesConfigMapConverter {
  /**
   * API ConfigMap to front ConfigMap
   */
  static apiToConfigMap(data, yaml) {
    const res = new KubernetesConfigMap();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.ConfigurationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] : '';
    res.CreationDate = data.metadata.creationTimestamp;
    res.Yaml = yaml ? yaml.data : '';
    res.Data = data.data;
    return res;
  }

  /**
   * Generate a default ConfigMap Model
   * with ID = 0 (showing it's a default)
   * but setting his Namespace and Name
   */
  static defaultConfigMap(namespace, name) {
    const res = new KubernetesConfigMap();
    res.Name = name;
    res.Namespace = namespace;
    return res;
  }

  /**
   * CREATE payload
   */
  static createPayload(data) {
    const res = new KubernetesConfigMapCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    const configurationOwner = _.truncate(data.ConfigurationOwner, { length: 63, omission: '' });
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = configurationOwner;
    res.data = data.Data;
    return res;
  }

  /**
   * UPDATE payload
   */
  static updatePayload(data) {
    const res = new KubernetesConfigMapUpdatePayload();
    res.metadata.uid = data.Id;
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.metadata.labels[KubernetesPortainerConfigurationOwnerLabel] = data.ConfigurationOwner;
    res.data = data.Data;
    return res;
  }

  static configurationFormValuesToConfigMap(formValues) {
    const res = new KubernetesConfigMap();
    res.Id = formValues.Id;
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

export default KubernetesConfigMapConverter;
