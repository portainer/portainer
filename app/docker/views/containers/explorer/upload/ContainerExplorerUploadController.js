import '../containerExplorer.css';

angular.module('portainer.docker').controller('ContainerExplorerUploadController', [
  '$scope',
  '$window',
  '$transition$',
  'Notifications',
  'ContainerService',
  'HttpRequestHelper',
  'ExplorerService',
  function ($scope, $window, $transition$, Notifications, ContainerService, HttpRequestHelper, ExplorerService) {
    $scope.explorerService = ExplorerService;
    $scope.uploadFileList = [];

    $scope.upload = function () {
      if ($scope.uploadFileList.length <= 0) {
        Notifications.error('Failure', null, 'select upload files.');
        return;
      }

      const self = this;
      ExplorerService.upload($scope.uploadFileList)
        .then(function () {
          Notifications.success('files upload successfully');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'files upload failed');
        })
        ['finally'](function () {
          self.uploadFileList = [];
        });
    };

    $scope.goBack = function () {
      $window.history.back();
    };

    $scope.addForUpload = function ($files) {
      $scope.uploadFileList = $scope.uploadFileList.concat($files);
    };

    $scope.removeFromUpload = function (index) {
      $scope.uploadFileList.splice(index, 1);
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
