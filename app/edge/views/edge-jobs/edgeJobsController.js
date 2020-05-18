import angular from 'angular';

function EdgeJobsController($scope, $state, Notifications, ModalService, EdgeJobService) {
  $scope.removeAction = removeAction;

  function removeAction(selectedItems) {
    ModalService.confirmDeletion('Do you want to remove the selected schedule(s) ?', function onConfirm(confirmed) {
      if (!confirmed) {
        return;
      }
      deleteSelectedSchedules(selectedItems);
    });
  }

  function deleteSelectedSchedules(schedules) {
    var actionCount = schedules.length;
    angular.forEach(schedules, function (schedule) {
      EdgeJobService.deleteSchedule(schedule.Id)
        .then(function success() {
          Notifications.success('Schedule successfully removed', schedule.Name);
          var index = $scope.schedules.indexOf(schedule);
          $scope.schedules.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove schedule ' + schedule.Name);
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
    EdgeJobService.schedules()
      .then(function success(data) {
        $scope.schedules = data;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve schedules');
        $scope.schedules = [];
      });
  }

  initView();
}

angular.module('portainer.edge').controller('EdgeJobsController', EdgeJobsController);
