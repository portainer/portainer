import { STACK_NAME_VALIDATION_REGEX } from '@/constants';

angular.module('portainer.app').controller('StackDuplicationFormController', [
  'Notifications',
  '$scope',
  function StackDuplicationFormController(Notifications, $scope) {
    var ctrl = this;

    ctrl.environmentSelectorOptions = null;

    ctrl.state = {
      duplicationInProgress: false,
      migrationInProgress: false,
    };

    ctrl.formValues = {
      endpoint: null,
      newName: '',
    };

    ctrl.STACK_NAME_VALIDATION_REGEX = STACK_NAME_VALIDATION_REGEX;

    ctrl.isFormValidForDuplication = isFormValidForDuplication;
    ctrl.isFormValidForMigration = isFormValidForMigration;
    ctrl.duplicateStack = duplicateStack;
    ctrl.migrateStack = migrateStack;
    ctrl.isMigrationButtonDisabled = isMigrationButtonDisabled;
    ctrl.isEndpointSelected = isEndpointSelected;
    ctrl.onChangeEnvironment = onChangeEnvironment;
    ctrl.$onChanges = $onChanges;

    function isFormValidForMigration() {
      return ctrl.formValues.endpoint && ctrl.formValues.endpoint.Id;
    }

    function isFormValidForDuplication() {
      return isFormValidForMigration() && ctrl.formValues.newName && !ctrl.yamlError;
    }

    function onChangeEnvironment(value) {
      return $scope.$evalAsync(() => {
        ctrl.formValues.endpoint = value;
      });
    }

    function duplicateStack() {
      if (!ctrl.formValues.newName) {
        Notifications.error('Failure', null, 'Stack name is required for duplication');
        return;
      }
      ctrl.state.duplicationInProgress = true;
      ctrl
        .onDuplicate({
          endpointId: ctrl.formValues.endpoint.Id,
          name: ctrl.formValues.newName ? ctrl.formValues.newName : undefined,
        })
        .finally(function () {
          ctrl.state.duplicationInProgress = false;
        });
    }

    function migrateStack() {
      ctrl.state.migrationInProgress = true;
      ctrl
        .onMigrate({
          endpointId: ctrl.formValues.endpoint.Id,
          name: ctrl.formValues.newName ? ctrl.formValues.newName : undefined,
        })
        .finally(function () {
          ctrl.state.migrationInProgress = false;
        });
    }

    function isMigrationButtonDisabled() {
      return !ctrl.isFormValidForMigration() || ctrl.state.duplicationInProgress || ctrl.state.migrationInProgress || isTargetEndpointAndCurrentEquals();
    }

    function isTargetEndpointAndCurrentEquals() {
      return ctrl.formValues.endpoint && ctrl.formValues.endpoint.Id === ctrl.currentEndpointId;
    }

    function isEndpointSelected() {
      return ctrl.formValues.endpoint && ctrl.formValues.endpoint.Id;
    }

    function $onChanges() {
      ctrl.environmentSelectorOptions = getOptions(ctrl.groups, ctrl.endpoints);
    }
  },
]);

function getOptions(groups, environments) {
  if (!groups || !environments) {
    return [];
  }

  const groupSet = environments.reduce((groupSet, environment) => {
    const groupEnvironments = groupSet[environment.GroupId] || [];

    return {
      ...groupSet,
      [environment.GroupId]: [...groupEnvironments, { label: environment.Name, value: environment.Id }],
    };
  }, {});

  return Object.entries(groupSet).map(([groupId, environments]) => {
    const group = groups.find((group) => group.Id === parseInt(groupId, 10));
    if (!group) {
      throw new Error('missing group');
    }

    return {
      label: group.Name,
      options: environments,
    };
  });
}
