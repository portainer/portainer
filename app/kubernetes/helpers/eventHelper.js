import _ from 'lodash-es';

class KubernetesEventHelper {
  static warningCount(events) {
    const warnings = _.filter(events, (event) => event.Type === 'Warning');
    return warnings.length;
  }
}

export default KubernetesEventHelper;
