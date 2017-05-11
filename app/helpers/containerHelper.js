angular.module('portainer.helpers')
.factory('ContainerHelper', [function ContainerHelperFactory() {
  'use strict';
  var helper = {};

  helper.commandStringToArray = function(command) {
    return splitargs(command);
  };

  helper.commandArrayToString = function(array) {
    return array.join(' ');
  };

  helper.hideContainers = function(containers, containersToHideLabels) {
    return containers.filter(function (container) {
      var filterContainer = false;
      containersToHideLabels.forEach(function(label, index) {
        if (_.has(container.Labels, label.name) &&
        container.Labels[label.name] === label.value) {
          filterContainer = true;
        }
      });
      if (!filterContainer) {
        return container;
      }
    });
  };

  return helper;
}]);
