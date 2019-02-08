angular.module('portainer.docker')
  .controller('NetworksDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      var PREDEFINED_NETWORKS = ['host', 'bridge', 'none'];

      this.disableRemove = function(item) {
        return PREDEFINED_NETWORKS.includes(item.Name);
      };
  }
]);