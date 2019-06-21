angular.module('portainer.docker')
  .controller('StoridgeDrivesDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.allowSelection = function (item) {
        return item.Status !== 'normal';
      };
  }
]);