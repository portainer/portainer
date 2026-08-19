import _ from 'lodash-es';
import angular from 'angular';

class NetworkHelper {
  /* @ngInject */
  constructor(PREDEFINED_NETWORKS) {
    this.PREDEFINED_NETWORKS = PREDEFINED_NETWORKS;
  }

  isSystemNetwork(item) {
    return _.includes(this.PREDEFINED_NETWORKS, item.Name);
  }
}

export default NetworkHelper;
angular.module('portainer.app').service('NetworkHelper', NetworkHelper);
