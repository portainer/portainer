import * as _ from 'lodash-es';

export class KubernetesIngressHelper {
  static findSBoundServiceIngressesRules(ingresses, serviceName) {
    const rules = _.flatMap(ingresses, 'Rules');
    return _.filter(rules, { ServiceName: serviceName });
  }
}
