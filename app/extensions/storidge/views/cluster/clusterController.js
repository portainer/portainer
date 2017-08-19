angular.module('extension.storidge')
.controller('StoridgeClusterController', ['$q', '$scope', '$state', 'Notifications', 'Pagination',
function ($q, $scope, $state, Notifications, Pagination) {

  $scope.rebootCluster = function() {

  };

  $scope.shutdownCluster = function() {

  };

  function initView() {
    $scope.cluster = {
      Capacity: {
        Total: '1,1 TB',
        Available: '300 GB',
        Used: '800 GB',
        Provisioned: '1 TB'
      },
      Nodes: [
        { Name: 'NodeA' }, { Name: 'NodeB' }, { Name: 'NodeC' }
      ]
    };
  }

  initView();
}]);
