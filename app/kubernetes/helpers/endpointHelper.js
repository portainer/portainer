import _ from 'lodash-es';

class KubernetesEventHelper {
  static getLeader(endpoints) {
    let leader = '';
    _.forEach(endpoints, (endpoint) => {
      if (endpoint.HolderIdentity) {
        leader = endpoint.HolderIdentity;
        return false;
      }
    });
    return leader;
  }
}

export default KubernetesEventHelper;
