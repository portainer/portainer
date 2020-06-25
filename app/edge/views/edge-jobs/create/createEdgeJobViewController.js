import angular from 'angular';

class CreateEdgeJobController {
  constructor($async, $q, $state, EdgeJobService, GroupService, Notifications, TagService) {
    this.state = {
      actionInProgress: false,
    };

    this.$async = $async;
    this.$q = $q;
    this.$state = $state;
    this.Notifications = Notifications;
    this.GroupService = GroupService;
    this.EdgeJobService = EdgeJobService;
    this.TagService = TagService;

    this.create = this.create.bind(this);
    this.createEdgeJob = this.createEdgeJob.bind(this);
    this.createAsync = this.createAsync.bind(this);
  }

  create(method) {
    return this.$async(this.createAsync, method);
  }

  async createAsync(method) {
    this.state.actionInProgress = true;

    try {
      await this.createEdgeJob(method, this.model);
      this.Notifications.success('Edge job successfully created');
      this.$state.go('edge.jobs', {}, { reload: true });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create Edge job');
    }

    this.state.actionInProgress = false;
  }

  createEdgeJob(method, model) {
    if (method === 'editor') {
      return this.EdgeJobService.createEdgeJobFromFileContent(model);
    }
    return this.EdgeJobService.createEdgeJobFromFileUpload(model);
  }

  async $onInit() {
    this.model = {
      Name: '',
      Recurring: false,
      CronExpression: '',
      Endpoints: [],
      FileContent: '',
      File: null,
    };

    try {
      const [groups, tags] = await Promise.all([this.GroupService.groups(), this.TagService.tags()]);
      this.groups = groups;
      this.tags = tags;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve page data');
    }
  }
}

angular.module('portainer.edge').controller('CreateEdgeJobController', CreateEdgeJobController);
export default CreateEdgeJobController;
