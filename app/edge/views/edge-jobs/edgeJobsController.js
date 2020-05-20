import angular from 'angular';

function EdgeJobsController($scope, $state, Notifications, ModalService, EdgeJobService) {
  $scope.removeAction = removeAction;

  function removeAction(selectedItems) {
    ModalService.confirmDeletion('Do you want to remove the selected edge job(s) ?', function onConfirm(confirmed) {
      if (!confirmed) {
        return;
      }
      deleteSelectedEdgeJobs(selectedItems);
    });
  }

  function deleteSelectedEdgeJobs(edgeJobs) {
    var actionCount = edgeJobs.length;
    angular.forEach(edgeJobs, function (edgeJob) {
      EdgeJobService.deleteEdgeJob(edgeJob.Id)
        .then(function success() {
          Notifications.success('Schedule successfully removed', edgeJob.Name);
          var index = $scope.edgeJobs.indexOf(edgeJob);
          $scope.edgeJobs.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove schedule ' + edgeJob.Name);
        })
        .finally(function final() {
          --actionCount;
          if (actionCount === 0) {
            $state.reload();
          }
        });
    });
  }

  function initView() {
    EdgeJobService.edgeJobs()
      .then(function success(data) {
        $scope.edgeJobs = data;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve Edge jobs');
        $scope.edgeJobs = [];
      });
  }

  initView();
}

angular.module('portainer.edge').controller('EdgeJobsController', EdgeJobsController);
