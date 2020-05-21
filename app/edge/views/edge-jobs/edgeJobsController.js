import angular from 'angular';

function EdgeJobsController($state, Notifications, ModalService, EdgeJobService) {
  this.removeAction = removeAction;

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
        .then(() => {
          Notifications.success('Schedule successfully removed', edgeJob.Name);
          var index = this.edgeJobs.indexOf(edgeJob);
          this.edgeJobs.splice(index, 1);
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
  this.$onInit = $onInit;
  function $onInit() {
    EdgeJobService.edgeJobs()
      .then((data) => {
        this.edgeJobs = data;
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to retrieve Edge jobs');
        this.edgeJobs = [];
      });
  }
}

angular.module('portainer.edge').controller('EdgeJobsController', EdgeJobsController);
