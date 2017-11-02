angular.module('project', [])
.controller('ProjectController', ['$scope', '$state', '$transition$', 'LabelHelper', 'Project', 'ProjectHelper', 'Pagination', 'Notifications',
function ($scope, $state, $transition$, LabelHelper, Project, ProjectHelper, Pagination, Notifications) {

  $scope.state = {};
  $scope.loading = true;
  $scope.tasks = [];
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

}]);