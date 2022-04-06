import _ from 'lodash-es';

export class EdgeJobsViewController {
  /* @ngInject */
  constructor($async, $state, EdgeJobService, ModalService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.EdgeJobService = EdgeJobService;
    this.ModalService = ModalService;
    this.Notifications = Notifications;

    this.removeAction = this.removeAction.bind(this);
    this.deleteJobsAsync = this.deleteJobsAsync.bind(this);
    this.deleteJobs = this.deleteJobs.bind(this);
  }

  removeAction(selectedItems) {
    this.ModalService.confirmDeletion('Do you want to remove the selected edge job(s) ?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      this.deleteJobs(selectedItems);
    });
  }

  deleteJobs(edgeJobs) {
    return this.$async(this.deleteJobsAsync, edgeJobs);
  }

  async deleteJobsAsync(edgeJobs) {
    for (let edgeJob of edgeJobs) {
      try {
        await this.EdgeJobService.remove(edgeJob.Id);
        this.Notifications.success('Edge job successfully removed', edgeJob.Name);
        _.remove(this.edgeJobs, edgeJob);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove Edge job ' + edgeJob.Name);
      }
    }

    this.$state.reload();
  }

  async $onInit() {
    try {
      const edgeJobs = await this.EdgeJobService.edgeJobs();
      this.edgeJobs = edgeJobs;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve Edge jobs');
      this.edgeJobs = [];
    }
  }
}
