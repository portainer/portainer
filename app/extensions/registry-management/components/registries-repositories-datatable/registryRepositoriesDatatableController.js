import _ from 'lodash-es';

angular.module('portainer.app')
.controller('RegistryRepositoriesDatatableController', ['$scope', '$controller',
  function($scope, $controller) {
    var ctrl = this;

    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
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
          ctrl.paginationAction(_.filter(newValue, {'TagsCount':0}));
        }
      }, true);
  }
]);
