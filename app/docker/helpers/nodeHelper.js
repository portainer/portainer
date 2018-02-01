angular.module('portainer.docker')
.factory('NodeHelper', [function NodeHelperFactory() {
  'use strict';
  return {
    nodeToConfig: function(node) {
      return {
        Name: node.Spec.Name,
        Role: node.Spec.Role,
        Labels: node.Spec.Labels,
        Availability: node.Spec.Availability
      };
    },
    getManagerIP: function(nodes) {
      var managerIp;
      for (var n in nodes) {
        if (undefined === nodes[n].ManagerStatus || nodes[n].ManagerStatus.Reachability !== 'reachable') {
          continue;
        }
        managerIp = nodes[n].ManagerStatus.Addr.split(':')[0];
      }
      return managerIp;
    }
  };
}]);
