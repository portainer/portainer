angular.module('portainer.app').controller('StackDuplicationFormController', [
  'Notifications', 'StackService', 'EndpointProvider',
  function StackDuplicationFormController(Notifications, StackService, EndpointProvider) {
    var ctrl = this;

    ctrl.state = {
      duplicationInProgress: false,
      migrationInProgress: false
    };

    ctrl.formValues = {
      endpoint: null,
      newName: ''
    };

    ctrl.isFormValidForDuplication = isFormValidForDuplication;
    ctrl.isFormValidForMigration = isFormValidForMigration;
    ctrl.duplicateStack = duplicateStack;
    ctrl.migrateStack = migrateStack;
    ctrl.isMigrationButtonDisabled = isMigrationButtonDisabled;
    ctrl.stackNameAvailable = true;

    ctrl.stackNameChange = function(name) {
      ctrl.stackNameAvailable = ctrl.stackNames.indexOf(name) === -1;
    }

    function isFormValidForMigration() {
      return ctrl.formValues.endpoint && ctrl.formValues.endpoint.Id && ctrl.stackNameAvailable;
    }

    function isFormValidForDuplication() {
      return isFormValidForMigration() && ctrl.formValues.newName && ctrl.stackNameAvailable;
    }

    function duplicateStack() {
      if (!ctrl.formValues.newName) {
        Notifications.error(
          'Failure',
          null,
          'Stack name is required for duplication'
        );
        return;
      }
      ctrl.state.duplicationInProgress = true;
      ctrl.onDuplicate({
          endpointId: ctrl.formValues.endpoint.Id,
          name: ctrl.formValues.newName ? ctrl.formValues.newName : undefined
        })
        .finally(function() {
          ctrl.state.duplicationInProgress = false;
        });
    }

    function migrateStack() {
      ctrl.state.migrationInProgress = true;
      ctrl.onMigrate({
          endpointId: ctrl.formValues.endpoint.Id,
          name: ctrl.formValues.newName ? ctrl.formValues.newName : undefined
        })
        .finally(function() {
          ctrl.state.migrationInProgress = false;
        });
    }

    function isMigrationButtonDisabled() {
      return (
        !ctrl.isFormValidForMigration() ||
        ctrl.state.duplicationInProgress ||
        ctrl.state.migrationInProgress ||
        isTargetEndpointAndCurrentEquals()
      );
    }

    function isTargetEndpointAndCurrentEquals() {
      return (
        ctrl.formValues.endpoint &&
        ctrl.formValues.endpoint.Id === ctrl.currentEndpointId
      );
    }

    function initView() {
      var endpointMode = ctrl.applicationState.endpoint.mode;
      var endpointId = EndpointProvider.endpointID();
  
      StackService.stacks(
        true,
        endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER',
        endpointId
      )
      .then(function success(data) {
        ctrl.stackNames = data.map(x => x.Name);
      })
      .catch(function error(err) {
        ctrl.stacks = [];
        Notifications.error('Failure', err, 'Unable to retrieve stacks');
      });
    }
  
    initView();
  }
]);
