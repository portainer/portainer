angular.module('portainer.app')
.controller('RegistryRepositoriesTagsDatatableController', ['$scope', '$controller',
  function($scope, $controller) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
    var ctrl = this;
    this.state.orderBy = this.orderBy;

    function areDifferent(a, b) {
      if (!a || !b) {
        return true;
      }
      var namesA = a.map( function(x){ return x.Name; } ).sort();
      var namesB = b.map( function(x){ return x.Name; } ).sort();
      return namesA.join(',') !== namesB.join(',');
    }

    $scope.$watch(function() { return ctrl.state.filteredDataSet;},
      function(newValue, oldValue) {
        if (newValue && areDifferent(oldValue, newValue)) {
          ctrl.paginationAction(_.filter(newValue, {'ImageId': ''}));
        }
      }, true);
  }
]);
