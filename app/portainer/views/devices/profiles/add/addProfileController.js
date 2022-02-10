import angular from 'angular';

import { createProfile } from 'Portainer/hostmanagement/fdo/fdo.service';

angular.module('portainer.app').controller('AddProfileController', AddProfileController);

export default function AddProfileController($scope, $async, $state, $window, ModalService, Authentication, Notifications) {
  $scope.formValues = {
    name: '',
    profileFileContent: '',
  };

  $scope.state = {
    method: 'editor',
    actionInProgress: false,
    isEditorDirty: false,
  };

  $window.onbeforeunload = () => {
    if ($scope.state.method === 'editor' && $scope.formValues.profileFileContent && $scope.state.isEditorDirty) {
      return '';
    }
  };

  $scope.$on('$destroy', function () {
    $scope.state.isEditorDirty = false;
  });

  $scope.onChangeFormValues = onChangeFormValues;

  $scope.createProfileAsync = function () {
    return $async(async () => {
      const method = $scope.state.method;

      const name = $scope.formValues.name;
      const fileContent = $scope.formValues.profileFileContent;

      if (method !== 'editor' && fileContent === '') {
        $scope.state.formValidationError = 'Profile file content must not be empty';
        return;
      }

      $scope.state.actionInProgress = true;

      try {
        await createProfile(name, method, fileContent);
        Notifications.success('Profile successfully created');
        $scope.state.isEditorDirty = false;
        $state.go('portainer.settings.edgeCompute');
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to create Profile');
      } finally {
        $scope.state.actionInProgress = false;
      }
    });
  };

  $scope.onChangeFileContent = function onChangeFileContent(value) {
    $scope.formValues.profileFileContent = value;
    $scope.state.isEditorDirty = true;
  };

  function onChangeFormValues(newValues) {
    $scope.formValues = newValues;
  }
}
