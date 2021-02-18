import _ from 'lodash-es';
import angular from 'angular';

const PREDEFINED_NETWORKS = ['host', 'bridge', 'none'];

class NetworkHelper {
  isSystemNetwork(item) {
    return _.includes(PREDEFINED_NETWORKS, item.Name);
  }
}

export default NetworkHelper;
angular.module('portainer.app').service('NetworkHelper', NetworkHelper);
