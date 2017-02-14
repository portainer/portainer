angular
.module('portainer')
.directive('rdSelectAll', function () {
  return {
    restrict: 'E',
    template: '<input type="checkbox" ng-model="isAllSelected" />',
    scope: {
      all: '='
    },
    link: function (scope, element, attr) {

      scope.$watch('isAllSelected', function () {
        scope.all.forEach(function (val) {
          val.isSelected = scope.isAllSelected;
        });
      });

      scope.$watch('all', function (newVal, oldVal) {
        if (oldVal) {
          oldVal.forEach(function (val) {
            val.isSelected = false;
          });
        }

        scope.isAllSelected = false;
      });
    }
  };
});
