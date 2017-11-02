angular.module('project', [])
.controller('ProjectController', ['$scope', '$state', '$transition$', 'LabelHelper', 'ProjectService', 'Pagination', 'Notifications',
function ($scope, $state, $transition$, LabelHelper, ProjectService, Pagination, Notifications) {

  $scope.state = {};
  $scope.loading = true;
  $scope.tasks = [];
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

  function initView() {
    $scope.loading = true;

    ProjectService.externalProject($transition$.params().id)
    .then(function success(data) {
        $scope.project = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve project');
    })
    .finally(function final() {
      $scope.loading = false;
    });
  }

  initView();
}]);