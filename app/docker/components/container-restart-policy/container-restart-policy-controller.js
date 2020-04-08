angular.module('portainer.docker').controller('ContainerRestartPolicyController', [
  function ContainerRestartPolicyController() {
    var ctrl = this;

    this.state = {
      editModel: {},
    };

    ctrl.save = save;

    function save() {
      if (ctrl.state.editModel.name === ctrl.name && ctrl.state.editModel.maximumRetryCount === ctrl.maximumRetryCount) {
        return;
      }
      ctrl.updateRestartPolicy(ctrl.state.editModel);
    }

    this.$onInit = function () {
      ctrl.state.editModel = {
        name: ctrl.name ? ctrl.name : 'no',
        maximumRetryCount: ctrl.maximumRetryCount,
      };
    };
  },
]);
