angular.module('portainer.docker').factory('TaskHelper', [
  function TaskHelperFactory() {
    'use strict';

    var helper = {};

    helper.associateContainerToTask = function (task, containers) {
      for (var i = 0; i < containers.length; i++) {
        var container = containers[i];
        if (task.ContainerId === container.Id) {
          task.Container = container;
          break;
        }
      }
    };

    return helper;
  },
]);
