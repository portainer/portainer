angular.module('portainer.docker').controller('NodeBrowserController', [
  'NodeService',
  'HttpRequestHelper',
  '$stateParams',
  function NodeBrowserController(NodeService, HttpRequestHelper, $stateParams) {
    var ctrl = this;

    ctrl.$onInit = $onInit;

    function $onInit() {
      ctrl.nodeId = $stateParams.id;
      NodeService.node(ctrl.nodeId).then(function onNodeLoaded(node) {
        HttpRequestHelper.setPortainerAgentTargetHeader(node.Hostname);
        ctrl.node = node;
      });
    }
  }
]);
