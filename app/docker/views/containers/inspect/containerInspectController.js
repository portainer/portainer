angular.module('portainer.docker').controller('ContainerInspectController', [
  '$scope',
  '$transition$',
  'Notifications',
  'ContainerService',
  'HttpRequestHelper',
  'endpoint',
  function ($scope, $transition$, Notifications, ContainerService, HttpRequestHelper, endpoint) {
    $scope.state = {
      DisplayTextView: false,
    };
    $scope.containerInfo = {};

    function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      ContainerService.inspect(endpoint.Id, $transition$.params().id)
        .then(function success(d) {
          $scope.containerInfo = d;
        })
        .catch(function error(e) {
          Notifications.error('Failure', e, 'Unable to inspect container');
        });
    }

    initView();
  },
]);
