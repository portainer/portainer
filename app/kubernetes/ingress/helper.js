import _ from 'lodash-es';

export class KubernetesIngressHelper {
  static findSBoundServiceIngressesRules(ingresses, serviceName) {
    const rules = _.flatMap(ingresses, 'Paths');
    return _.filter(rules, { ServiceName: serviceName });
  }
}
