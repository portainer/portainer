angular.module('portainer.docker')
.controller('TasksDatatableController', ['$scope', '$controller',
function ($scope, $controller) {

  angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

  this.state = Object.assign(this.state, {
    showQuickActionStats: true,
    showQuickActionLogs: true,
    showQuickActionExec: true,
    showQuickActionInspect: true,
    showQuickActionAttach: false
  });
}]);
