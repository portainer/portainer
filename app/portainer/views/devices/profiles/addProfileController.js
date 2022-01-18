import angular from 'angular';

import { createProfile } from '@/portainer/hostmanagement/fdo/fdo.service';

angular.module('portainer.app').controller('AddProfileController', function ($scope, $async, $state, $window, ModalService, Authentication, Notifications) {
  $scope.formValues = {
    Name: '',
    ProfileFileContent: '',
  };

  $scope.state = {
    Method: 'editor',
    actionInProgress: false,
    isEditorDirty: false,
  };

  $window.onbeforeunload = () => {
    if ($scope.state.Method === 'editor' && $scope.formValues.ProfileFileContent && $scope.state.isEditorDirty) {
      return '';
    }
  };

  $scope.$on('$destroy', function () {
    $scope.state.isEditorDirty = false;
  });

  $scope.onChangeFormValues = onChangeFormValues;

  $scope.createProfileAsync = function () {
    return $async(async () => {
      const method = $scope.state.Method;

      const name = $scope.formValues.Name;
      const fileContent = $scope.formValues.ProfileFileContent;

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
    $scope.formValues.ProfileFileContent = value;
    $scope.state.isEditorDirty = true;
  };

  function onChangeFormValues(newValues) {
    $scope.formValues = newValues;
  }
});
