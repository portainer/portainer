import angular from 'angular';

class EditEdgeStackViewController {
  constructor($state, EdgeGroupService, EdgeStackService, Notifications) {
    this.$state = $state;
    this.EdgeGroupService = EdgeGroupService;
    this.EdgeStackService = EdgeStackService;
    this.Notifications = Notifications;

    this.stack = null;
    this.edgeGroups = null;

    this.state = {
      actionInProgress: false,
    };

    this.editorUpdate = this.editorUpdate.bind(this);
  }

  async $onInit() {
    const { stackId } = this.$state.params;
    try {
      const [edgeGroups, model, file] = await Promise.all([this.EdgeGroupService.groups(), this.EdgeStackService.stack(stackId), this.EdgeStackService.stackFile(stackId)]);
      this.edgeGroups = edgeGroups;
      this.stack = model;
      this.formValues = {
        StackFileContent: file,
        EdgeGroups: this.stack.EdgeGroups,
      };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve stack data');
    }
  }

  editorUpdate(cm) {
    this.formValues.StackFileContent = cm.getValue();
  }
}

angular.module('portainer.edge').controller('EditEdgeStackViewController', EditEdgeStackViewController);
export default EditEdgeStackViewController;
