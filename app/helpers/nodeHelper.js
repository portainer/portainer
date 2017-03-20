angular.module('portainer.helpers')
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
      var manager_ip = undefined;
      for (var n in nodes) {
        if (undefined === nodes[n].ManagerStatus || nodes[n].ManagerStatus.Reachability !== "reachable") {
          continue;
        }
        manager_ip = nodes[n].ManagerStatus.Addr.split(":")[0];
      }
      return manager_ip;
    }
  };
}]);
