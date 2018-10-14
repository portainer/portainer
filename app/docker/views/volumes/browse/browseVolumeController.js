import angular from 'angular';

angular.module('portainer.docker')
.controller('BrowseVolumeController', ['$scope', '$transition$',
function ($scope, $transition$) {

  function initView() {
    $scope.volumeId = $transition$.params().id;
    $scope.nodeName = $transition$.params().nodeName;
  }

  initView();
}]);
