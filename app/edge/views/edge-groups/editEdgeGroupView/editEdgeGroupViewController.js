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
    this.updateGroupAsync = this.updateGroupAsync.bind(this);
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

  updateGroup() {
    return this.$async(this.updateGroupAsync);
  }

  async updateGroupAsync() {
    this.state.actionInProgress = true;
    try {
      await this.EdgeGroupService.update(this.model);
      this.Notifications.success('Edge group successfully updated');
      this.$state.go('edge.groups');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update edge group');
    } finally {
      this.state.actionInProgress = false;
    }
  }
}
