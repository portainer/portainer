import * as _ from 'lodash-es';

export class KubernetesIngressHelper {
  static findSBoundServiceIngressesRules(ingresses, service) {
    const rules = _.flatMap(ingresses, 'Rules');
    return _.filter(rules, (r) => r.ServiceName === service.metadata.name);
  }
}
