import angular from 'angular';

function EdgeJobsController($state, Notifications, ModalService, EdgeJobService) {
  this.removeAction = removeAction.bind(this);
  this.deleteSelectedEdgeJobs = deleteSelectedEdgeJobs.bind(this);

  function removeAction(selectedItems) {
    ModalService.confirmDeletion('Do you want to remove the selected edge job(s) ?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      this.deleteSelectedEdgeJobs(selectedItems);
    });
  }

  function deleteSelectedEdgeJobs(edgeJobs) {
    var actionCount = edgeJobs.length;
    angular.forEach(edgeJobs, (edgeJob) => {
      EdgeJobService.deleteEdgeJob(edgeJob.Id)
        .then(() => {
          Notifications.success('Schedule successfully removed', edgeJob.Name);
          var index = this.edgeJobs.indexOf(edgeJob);
          this.edgeJobs.splice(index, 1);
        })
        .catch((err) => {
          Notifications.error('Failure', err, 'Unable to remove schedule ' + edgeJob.Name);
        })
        .finally(() => {
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
export default EdgeJobsController;
