angular.module('portainer.docker').controller('ContainerExplorerCreateController', [
  '$scope',
  '$window',
  '$transition$',
  'Notifications',
  'ContainerService',
  'HttpRequestHelper',
  'ExplorerService',
  function ($scope, $window, $transition$, Notifications, ContainerService, HttpRequestHelper, ExplorerService) {
    $scope.explorerService = ExplorerService;

    $scope.createFolder = function (name) {
      var path = ExplorerService.currentPath + '/' + name;
      ExplorerService.create($transition$.params().id, path)
        .then(function () {
          Notifications.success('folder created successfully');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'folder created failed');
        });
    };

    $scope.goBack = function () {
      $window.history.back();
    };

    function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      ContainerService.container($transition$.params().id)
        .then(function success(data) {
          $scope.container = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve container information');
        });
    }

    initView();
  },
]);
