import angular from 'angular';

class EdgeJobsController {
  constructor($state, EdgeJobService, ModalService, Notifications) {
    this.$state = $state;
    this.EdgeJobService = EdgeJobService;
    this.ModalService = ModalService;
    this.Notifications = Notifications;

    this.removeAction = this.removeAction.bind(this);
    this.deleteSelectedEdgeJobs = this.deleteSelectedEdgeJobs.bind(this);
  }

  removeAction(selectedItems) {
    this.ModalService.confirmDeletion('Do you want to remove the selected edge job(s) ?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      this.deleteSelectedEdgeJobs(selectedItems);
    });
  }

  deleteSelectedEdgeJobs(edgeJobs) {
    var actionCount = edgeJobs.length;
    angular.forEach(edgeJobs, (edgeJob) => {
      this.EdgeJobService.deleteEdgeJob(edgeJob.Id)
        .then(() => {
          this.Notifications.success('Schedule successfully removed', edgeJob.Name);
          var index = this.edgeJobs.indexOf(edgeJob);
          this.edgeJobs.splice(index, 1);
        })
        .catch((err) => {
          this.Notifications.error('Failure', err, 'Unable to remove schedule ' + edgeJob.Name);
        })
        .finally(() => {
          --actionCount;
          if (actionCount === 0) {
            this.$state.reload();
          }
        });
    });
  }

  $onInit() {
    this.EdgeJobService.edgeJobs()
      .then((data) => {
        this.edgeJobs = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to retrieve Edge jobs');
        this.edgeJobs = [];
      });
  }
}

angular.module('portainer.edge').controller('EdgeJobsController', EdgeJobsController);
export default EdgeJobsController;
