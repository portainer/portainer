export class EditEdgeGroupController {
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

    this.updateGroup = this.updateGroup.bind(this);
  }

  async $onInit() {
    const [endpointGroups, group] = await Promise.all([this.GroupService.groups(), this.EdgeGroupService.group(this.$state.params.groupId)]);

    if (!group) {
      this.Notifications.error('Failed to find edge group', {});
      this.$state.go('edge.groups');
    }
    this.endpointGroups = endpointGroups;
    this.model = group;
    this.state.loaded = true;
  }

  updateGroup(group) {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        await this.EdgeGroupService.update(group);
        this.Notifications.success('Success', 'Edge group successfully updated');
        this.$state.go('edge.groups');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to update edge group');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }
}
