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
  }

  async $onInit() {
    const endpointGroups = await this.GroupService.groups();

    this.endpointGroups = endpointGroups;
    this.state.loaded = true;
  }

  async createGroup(model) {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        await this.EdgeGroupService.create(model);
        this.Notifications.success('Success', 'Edge group successfully created');
        this.$state.go('edge.groups');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to create edge group');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }
}
