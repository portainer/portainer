angular.module('portainer.docker')
  .controller('NetworksDatatableController', ['$scope', '$controller', 'PREDEFINED_NETWORKS',
    function ($scope, $controller, PREDEFINED_NETWORKS) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.disableRemove = function(item) {
        return PREDEFINED_NETWORKS.includes(item.Name);
      };

      /**
       * Do not allow PREDEFINED_NETWORKS to be selected
       */
      this.allowSelection = function(item) {
        return !this.disableRemove(item);
      }
  }
]);