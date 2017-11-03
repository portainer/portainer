angular.module('project', [])
.controller('ProjectController', ['$interval', '$scope', '$state', '$transition$', 'LabelHelper', 'ProjectService', 'Pagination', 'Notifications',
function ($interval, $scope, $state, $transition$, LabelHelper, ProjectService, Pagination, Notifications) {

  $scope.state = {};
  $scope.loading = true;
  $scope.tasks = [];
  $scope.sortType = 'Status';
  $scope.sortReverse = false;

  var statusPromise;

  $scope.statusAction = function () {
    $('#loadingViewSpinner').show();

    ProjectService.operationStatus($transition$.params().id)
        .then(function success(data) {
          $scope.operationStatus = data;
          ProjectService.messageStatus($transition$.params().id)
            .then(function success(data) {
              $scope.messageStatus = data;
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to get Orca message status');
            });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to get Orca operation status');
        })
        .finally(function final() {
          $('#loadingViewSpinner').hide();
        });
  };

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

        $scope.statusAction()
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve project');
    })
    .finally(function final() {
      $scope.loading = false;
      statusPromise = $interval($scope.statusAction, 5000);
    });
  }

  $scope.$on('$destroy', function() {
      $interval.cancel(statusPromise);
  });

  initView();
}]);