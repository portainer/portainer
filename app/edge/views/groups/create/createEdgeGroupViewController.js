import angular from 'angular';

class CreateEdgeGroupController {
  /* @ngInject */
  constructor(
    EdgeGroupService,
    EndpointService,
    GroupService,
    TagService,
    Notifications,
    $state
  ) {
    this.EdgeGroupService = EdgeGroupService;
    this.EndpointService = EndpointService;
    this.GroupService = GroupService;
    this.TagService = TagService;
    this.Notifications = Notifications;
    this.$state = $state;

    this.state = {
      actionInProgress: false
    };

    this.model = {
      Name: '',
      Endpoints: [],
      Dynamic: false,
      TagIds: []
    };

    this.onChangeTags = this.onChangeTags.bind(this);
    this.createGroup = this.createGroup.bind(this);
  }

  async $onInit() {
    const [tags, endpoints, endpointGroups] = await Promise.all([
      this.TagService.tags(),
      this.EndpointService.endpoints(undefined, undefined, undefined, 4),
      this.GroupService.groups()
    ]);
    this.tags = tags;
    this.endpoints = endpoints.value;
    this.endpointGroups = endpointGroups;
  }

  onChangeTags(tags) {
    this.model.TagIds = tags;
  }

  async createGroup() {
    this.state.actionInProgress = true;
    try {
      await this.EdgeGroupService.create(this.model);
      this.Notifications.success('Edge group successfully created');
      this.$state.go('edge.groups');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create edge group');
    }
    this.state.actionInProgress = false;
  }
}

angular
  .module('portainer.edge')
  .controller('CreateEdgeGroupController', CreateEdgeGroupController);
export default CreateEdgeGroupController;
