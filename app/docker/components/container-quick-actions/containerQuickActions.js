angular.module('portainer.docker').component('containerQuickActions', {
  templateUrl: './containerQuickActions.html',
  bindings: {
    containerId: '<',
    nodeName: '<',
    status: '<',
    state: '<',
    taskId: '<'
  }
});
