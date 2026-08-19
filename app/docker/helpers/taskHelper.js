angular.module('portainer.docker').factory('TaskHelper', [
  function TaskHelperFactory() {
    'use strict';

    var helper = {};

    helper.associateContainerToTask = associateContainerToTaskAJS;

    return helper;

    function associateContainerToTaskAJS(task, containers) {
      const container = containers.find((c) => c.Id === task.ContainerId);
      if (container) {
        task.Container = container;
      }
    }
  },
]);
