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
    }
  };
}]);
