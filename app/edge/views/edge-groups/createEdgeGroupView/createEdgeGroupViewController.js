export class CreateEdgeGroupController {
  /* @ngInject */
  constructor(EdgeGroupService, GroupService, Notifications, $state, $async) {
    this.EdgeGroupService = EdgeGroupService;
    this.GroupService = GroupService;
    this.Notifications = Notifications;
    this.$state = $state;
    this.$async = $async;

    this.state = {
      actionInProgress: false,
      loaded: false,
    };

    this.model = {
      Name: '',
      Endpoints: [],
      Dynamic: false,
      TagIds: [],
      PartialMatch: false,
    };

    this.createGroup = this.createGroup.bind(this);
    this.createGroupAsync = this.createGroupAsync.bind(this);
  }

  async $onInit() {
    const endpointGroups = await this.GroupService.groups();

    this.endpointGroups = endpointGroups;
    this.state.loaded = true;
  }

  createGroup() {
    return this.$async(this.createGroupAsync);
  }

  async createGroupAsync() {
    this.state.actionInProgress = true;
    try {
      await this.EdgeGroupService.create(this.model);
      this.Notifications.success('Edge group successfully created');
      this.$state.go('edge.groups');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create edge group');
    } finally {
      this.state.actionInProgress = false;
    }
  }
}
