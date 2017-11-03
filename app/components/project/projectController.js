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

        // Load image from Orca UI directly
        ProjectService.getProjectImage(data.Id, data.ParentDirName)
        .then(function success(imgdata) {
            $scope.projectImg = imgdata;
        })
        .catch(function error(err) {
            console.error("Unable to find project image to load");
        });
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