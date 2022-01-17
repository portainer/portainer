import angular from 'angular';

angular.module('portainer.app').controller('AddProfileController', function (
    $scope,
    $state,
    $window,
    ModalService,
    Authentication,
    Notifications,
) {
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

    $scope.createProfile = function () {
        var name = $scope.formValues.Name;
        var method = $scope.state.Method;

        if (method !== 'editor' && $scope.formValues.ProfileFileContent === '') {
            $scope.state.formValidationError = 'Profile file content must not be empty';
            return;
        }

        $scope.state.actionInProgress = true;

        console.log(name);
        console.log($scope.formValues.ProfileFileContent);

        // TODO
        StackService.createComposeStackFromFileContent(name, ProfileFileContent, env, endpointId)
            .then(function success() {
                Notifications.success('Profile successfully created');
                $scope.state.isEditorDirty = false;
                $state.go('docker.stacks');
            })
            .catch(function error(err) {
                Notifications.error('Failure', err, 'Unable to create Profile');
            })
            .finally(function final() {
                $scope.state.actionInProgress = false;
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
