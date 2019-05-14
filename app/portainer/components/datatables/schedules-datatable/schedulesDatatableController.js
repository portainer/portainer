angular.module('portainer.app')
  .controller('SchedulesDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {

      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      /**
       * Do not allow items
       */
      this.allowSelection = function(item) {
        return item.JobType === 1
      }
  }
]);
