import angular from 'angular';

class EditEdgeStackViewController {
  constructor($async, $state, EdgeGroupService, EdgeStackService, Notifications) {
    this.$async = $async;
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
    this.deployStack = this.deployStack.bind(this);
    this.deployStackAsync = this.deployStackAsync.bind(this);
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
        Prune: this.stack.Prune,
      };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve stack data');
    }
  }

  editorUpdate(cm) {
    this.formValues.StackFileContent = cm.getValue();
  }

  deployStack() {
    return this.$async(this.deployStackAsync);
  }

  async deployStackAsync() {
    this.state.actionInProgress = true;
    try {
      await this.EdgeStackService.updateStack(this.stack.Id, this.formValues);

      this.Notifications.success('Stack successfully deployed');
      this.$state.go('edge.stacks');
    } catch (err) {
      this.Notifications.error('Deployment error', err, 'Unable to deploy stack');
    } finally {
      this.state.actionInProgress = false;
    }
  }
}

angular.module('portainer.edge').controller('EditEdgeStackViewController', EditEdgeStackViewController);
export default EditEdgeStackViewController;
