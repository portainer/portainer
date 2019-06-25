import _ from 'lodash-es';

angular.module('portainer.app')
.controller('RegistryRepositoriesTagsDatatableController', ['$scope', '$controller',
  function($scope, $controller) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
    var ctrl = this;
    this.state.orderBy = this.orderBy;

    function diff(item) {
      return item.Name + item.ImageDigest;
    }

    function areDifferent(a, b) {
      if (!a || !b) {
        return true;
      }
      var namesA = _.sortBy(_.map(a, diff));
      var namesB = _.sortBy(_.map(b, diff));
      return namesA.join(',') !== namesB.join(',');
    }

    $scope.$watch(function() { return ctrl.state.filteredDataSet;},
      function(newValue, oldValue) {
        if (newValue && newValue.length && areDifferent(oldValue, newValue)) {
          ctrl.paginationAction(_.filter(newValue, {'ImageId': ''}));
        }
      }, true);
  }
]);
