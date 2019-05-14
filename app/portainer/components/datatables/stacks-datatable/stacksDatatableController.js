angular.module('portainer.app')
.controller('StacksDatatableController', ['$scope', '$controller',
function ($scope, $controller) {

  angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

   /**
   * Do not allow external items
   */
  this.allowSelection = function(item) {
    return !(item.External && item.Type === 2);
  }

}]);
