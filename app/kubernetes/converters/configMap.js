import _ from 'lodash-es';
import { KubernetesConfigMap } from 'Kubernetes/models/config-map/models';
import { KubernetesConfigMapGetPayload,
  KubernetesConfigMapCreatePayload,
  KubernetesConfigMapUpdatePayload
} from 'Kubernetes/models/config-map/payloads';
import { UserAccessViewModel, TeamAccessViewModel } from 'Portainer/models/access';

class KubernetesConfigMapConverter {
  /**
   * API ConfigMap to front ConfigMap
   */
  static apiToConfigMap(data) {
    const res = new KubernetesConfigMap();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.Data = {};
    const resData = data.data || {};
    _.forIn(resData, (value, key) => res.Data[key] = JSON.parse(value));
    return res;
  }

  /**
   * 
   */
  static modifiyNamespaceAccesses(configMap, namespace, accesses) {
    configMap.Data[namespace] = {
      UserAccessPolicies: {},
      TeamAccessPolicies: {}
    };
    _.forEach(accesses, (item) => {
      if (item instanceof UserAccessViewModel) {
        configMap.Data[namespace].UserAccessPolicies[item.Id] = {RoleId: 0};
      } else if (item instanceof TeamAccessViewModel) {
        configMap.Data[namespace].TeamAccessPolicies[item.Id] = {RoleId: 0};
      }
    });
    return configMap;
  }

  /**
   * Generate a default ConfigMap Model
   * with ID = 0 (showing it's a default)
   * but setting his Namespace and Name
   */
  static defaultConfigMap(namespace, name) {
    const res = new KubernetesConfigMap();
    res.Name = name
    res.Namespace = namespace;
    return res;
  }

  /**
   * GET payload
   */
  static getPayload(name) {
    const res = new KubernetesConfigMapGetPayload();
    res.id = name;
    return res;
  }

  /**
   * CREATE payload
   */
  static createPayload(data) {
    const res = new KubernetesConfigMapCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.data = {};
    _.forIn(data.Data, (value, key) => res.data[key] = JSON.stringify(value));
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
    res.data = {};
    _.forIn(data.Data, (value, key) => res.data[key] = JSON.stringify(value));
    return res;
  }
}

export default KubernetesConfigMapConverter;