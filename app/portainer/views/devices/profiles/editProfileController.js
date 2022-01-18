import angular from 'angular';
import { getProfile, updateProfile } from 'Portainer/hostmanagement/fdo/fdo.service';

angular.module('portainer.app').controller('EditProfileController', function ($scope, $async, $state, $window, ModalService, Authentication, Notifications) {
  $scope.formValues = {
    Name: '',
    ProfileFileContent: '',
  };

  $scope.state = {
    ProfileID: $state.params.id,
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

  $scope.updateProfileAsync = function () {
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
        await updateProfile($scope.state.ProfileID, name, fileContent);
        Notifications.success('Profile successfully updated');
        $scope.state.isEditorDirty = false;
        $state.go('portainer.settings.edgeCompute');
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to update Profile');
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

  async function initView() {
    return $async(async () => {
      try {
        const profile = await getProfile($scope.state.ProfileID);
        console.log('profile');
        console.log(profile);

        $scope.formValues = {
          Name: profile.name,
          ProfileFileContent: profile.fileContent,
        };
        $scope.state.isEditorDirty = false;
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve profile details');
      }
    });
  }

  initView();
});
