angular.module('user', [])
.controller('UserController', ['$scope', '$state', '$stateParams', 'ModalService', 'Messages',
function ($scope, $state, $stateParams, ModalService, Messages) {

  $scope.state = {
    updatePasswordError: '',
  };

  $scope.formValues = {
    newPassword: '',
    confirmPassword: ''
  };

  $scope.deleteUser = function() {
    ModalService.confirmDeletion(
      'Do you want to delete this user? This user will not be able to login into Portainer anymore.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteUser();
      }
    );
  };

  $scope.updatePermissions = function() {
    Messages.send('Permissions successfully updated', $scope.user.Username + ' is now ' + $scope.user.Role);
  };

  $scope.updatePassword = function() {
    $scope.state.updatePasswordError = 'An error occured';
    Messages.send('Password successfully updated');
  };

  function deleteUser() {
    Messages.send('User successfully deleted', $scope.user.Username);
  }

  function getUser() {
    $scope.user = {
      Id: 1,
      Username: "okenobi",
      Role: "administrator"
    };
  }

  getUser();
}]);
