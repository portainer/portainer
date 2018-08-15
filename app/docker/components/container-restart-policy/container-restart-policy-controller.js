angular
  .module('portainer.docker')
  .controller('ContainerRestartPolicyController', [
    ContainerRestartPolicyController
  ]);

function ContainerRestartPolicyController() {
  var vm = this;
  /*
  from bindings:
  containerId - container id
  name - restart policy name
  maximumRetryCount
  updateRestartPolicy: function to update the policy
  */
  vm.editMode = false;
  vm.editModel = {};

  // methods
  vm.toggleEdit = toggleEdit;
  vm.save = save;

  function toggleEdit() {
    vm.editMode = true;
    vm.editModel = {
      name: vm.name,
      maximumRetryCount: vm.maximumRetryCount
    };
  }

  function save() {
    if (
      vm.editModel.name === vm.name &&
      vm.editModel.maximumRetryCount === vm.maximumRetryCount
    ) {
      vm.editMode = false;
      return;
    }
    vm.updateRestartPolicy(vm.editModel).then(function onUpdateSucceed() {
      vm.editMode = false;
    });
  }
}
