import angular from 'angular';

class CreateEdgeJobController {
  constructor($q, $state, EdgeJobService, GroupService, Notifications, TagService) {
    this.state = {
      actionInProgress: false,
    };

    this.$q = $q;
    this.$state = $state;
    this.Notifications = Notifications;
    this.GroupService = GroupService;
    this.EdgeJobService = EdgeJobService;
    this.TagService = TagService;

    this.create = this.create.bind(this);
  }

  create(method) {
    const model = this.model;
    this.state.actionInProgress = true;
    this.createEdgeJob(method, model)
      .then(() => {
        this.Notifications.success('Edge job successfully created');
        this.$state.go('edge.jobs', {}, { reload: true });
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to create Edge job');
      })
      .finally(() => {
        this.state.actionInProgress = false;
      });
  }

  createEdgeJob(method, model) {
    if (method === 'editor') {
      return this.EdgeJobService.createEdgeJobFromFileContent(model);
    }
    return this.EdgeJobService.createEdgeJobFromFileUpload(model);
  }

  $onInit() {
    this.model = {
      Name: '',
      Recurring: false,
      CronExpression: '',
      Endpoints: [],
      FileContent: '',
      File: null,
    };
    this.$q
      .all({
        groups: this.GroupService.groups(),
        tags: this.TagService.tags(),
      })
      .then((data) => {
        this.groups = data.groups;
        this.tags = data.tags;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
      });
  }
}

angular.module('portainer.edge').controller('CreateEdgeJobController', CreateEdgeJobController);
export default CreateEdgeJobController;
