angular.module('portainer.docker').component('containerQuickActions', {
  templateUrl: 'app/docker/components/container-quick-actions/containerQuickActions.html',
  bindings: {
    containerId: '<',
    nodeName: '<',
    status: '<',
    state: '<',
    taskId: '<'
  }
});
