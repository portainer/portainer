angular.module('portainer.docker').controller('NodeBrowserController', [
  '$state', '$stateParams', 'NodeService', 'HttpRequestHelper', 'Notifications', 'StateManager',
  function NodeBrowserController($state, $stateParams, NodeService, HttpRequestHelper, Notifications, StateManager) {
    var ctrl = this;
    ctrl.$onInit = $onInit;

    function $onInit() {
      var hostManagementFeatures = StateManager.getState().application.enableHostManagementFeatures;
      if (!hostManagementFeatures) {
        $state.go('portainer.home');
      }
      ctrl.nodeId = $stateParams.id;

      NodeService.node(ctrl.nodeId)
      .then(function onNodeLoaded(node) {
        HttpRequestHelper.setPortainerAgentTargetHeader(node.Hostname);
        ctrl.node = node;
      })
      .catch(function onError(err) {
        Notifications.error('Unable to retrieve host information', err);
      });
    }
  }
]);
