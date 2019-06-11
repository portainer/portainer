angular.module('portainer.docker')
  .controller('StoridgeSnapshotsDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

  }
]);