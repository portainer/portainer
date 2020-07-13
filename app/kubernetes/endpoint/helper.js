import _ from 'lodash-es';

class KubernetesEndpointHelper {
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

export default KubernetesEndpointHelper;
