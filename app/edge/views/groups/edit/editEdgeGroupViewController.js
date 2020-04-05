import angular from 'angular';

class EditEdgeGroupController {
  /* @ngInject */
  constructor(EdgeGroupService, EndpointService, GroupService, TagService, Notifications, $state, $async) {
    this.EdgeGroupService = EdgeGroupService;
    this.EndpointService = EndpointService;
    this.GroupService = GroupService;
    this.TagService = TagService;
    this.Notifications = Notifications;
    this.$state = $state;
    this.$async = $async;

    this.state = {
      actionInProgress: false,
    };

    this.updateGroup = this.updateGroup.bind(this);
    this.onChangeTags = this.onChangeTags.bind(this);
  }

  async $onInit() {
    const [tags, endpoints, endpointGroups, group] = await Promise.all([
      this.TagService.tags(),
      this.EndpointService.endpoints(),
      this.GroupService.groups(),
      this.EdgeGroupService.group(this.$state.params.groupId),
    ]);

    if (!group) {
      this.Notifications.error('Failed to find edge group', {});
      this.$state.go('edge.groups');
    }
    this.tags = tags;
    this.endpoints = endpoints.value.filter((endpoint) => endpoint.Type === 4);
    this.endpointGroups = endpointGroups;
    this.model = group;
  }

  onChangeTags(tags) {
    this.model.TagIds = tags;
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
    }
    this.state.actionInProgress = false;
  }
}

angular.module('portainer.edge').controller('EditEdgeGroupController', EditEdgeGroupController);
export default EditEdgeGroupController;
