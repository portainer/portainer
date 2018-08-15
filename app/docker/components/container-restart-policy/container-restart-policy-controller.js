angular
  .module('portainer.docker')
  .controller('ContainerRestartPolicyController', [
    function ContainerRestartPolicyController() {
      var ctrl = this;

      this.state = {
        editMode :false,
        editModel :{}
      };
      

      ctrl.toggleEdit = toggleEdit;
      ctrl.save = save;

      function toggleEdit() {
        ctrl.state.editMode = true;
        ctrl.state.editModel = {
          name: ctrl.name,
          maximumRetryCount: ctrl.maximumRetryCount
        };
      }

      function save() {
        if (ctrl.state.editModel.name === ctrl.name &&
            ctrl.state.editModel.maximumRetryCount === ctrl.maximumRetryCount) {
          ctrl.state.editMode = false;
          return;
        }
        ctrl
          .updateRestartPolicy(ctrl.state.editModel)
          .then(function onUpdateSucceed() {
            ctrl.state.editMode = false;
          });
      }
    }
  ]);
