angular.module('portainer.app')
  .controller('AccessDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.disableRemove = function(item) {
        return item.Inherited;
      };

      this.allowSelection = function(item) {
        return !this.disableRemove(item);
      };
  }
]);