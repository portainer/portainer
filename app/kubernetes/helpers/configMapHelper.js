import _ from 'lodash-es';

import { KubernetesPortainerConfigMapAccessKey } from 'Kubernetes/models/config-map/models';
import { UserAccessViewModel, TeamAccessViewModel } from 'Portainer/models/access';

class KubernetesConfigMapHelper {
  static parseJSONData(configMap) {
    _.forIn(configMap.Data, (value, key) => {
      try {
        configMap.Data[key] = JSON.parse(value);
      } catch (err) {
        configMap.Data[key] = value;
      }
    });
    return configMap;
  }

  static modifiyNamespaceAccesses(configMap, namespace, accesses) {
    configMap.Data[KubernetesPortainerConfigMapAccessKey][namespace] = {
      UserAccessPolicies: {},
      TeamAccessPolicies: {},
    };
    _.forEach(accesses, (item) => {
      if (item instanceof UserAccessViewModel) {
        configMap.Data[KubernetesPortainerConfigMapAccessKey][namespace].UserAccessPolicies[item.Id] = { RoleId: 0 };
      } else if (item instanceof TeamAccessViewModel) {
        configMap.Data[KubernetesPortainerConfigMapAccessKey][namespace].TeamAccessPolicies[item.Id] = { RoleId: 0 };
      }
    });
    _.forIn(configMap.Data, (value, key) => {
      configMap.Data[key] = JSON.stringify(value);
    });
    return configMap;
  }
}
export default KubernetesConfigMapHelper;
