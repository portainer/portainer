angular.module('user', [])
.controller('UserController', ['$scope', '$state', '$stateParams', 'UserService', 'ModalService', 'Messages',
function ($scope, $state, $stateParams, UserService, ModalService, Messages) {

  $scope.state = {
    updatePasswordError: '',
  };

  $scope.formValues = {
    newPassword: '',
    confirmPassword: '',
    Administrator: false,
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
    $('#loadingViewSpinner').show();
    var role = $scope.formValues.Administrator ? 1 : 2;
    UserService.updateUser($scope.user.Id, undefined, role)
    .then(function success(data) {
      var newRole = role === 1 ? 'administrator' : 'user';
      Messages.success('Permissions successfully updated', $scope.user.Username + ' is now ' + newRole);
      $state.reload();
    })
    .catch(function error(err) {
      Messages.error("Failure", err, 'Unable to update user permissions');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.updatePassword = function() {
    $('#loadingViewSpinner').show();
    UserService.updateUser($scope.user.Id, $scope.formValues.newPassword, undefined)
    .then(function success(data) {
      Messages.success('Password successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      $scope.state.updatePasswordError = 'Unable to update password';
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function deleteUser() {
    $('#loadingViewSpinner').show();
    UserService.deleteUser($scope.user.Id)
    .then(function success(data) {
      Messages.success('User successfully deleted', $scope.user.Username);
      $state.go('users');
    })
    .catch(function error(err) {
      Messages.error("Failure", err, 'Unable to remove user');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function getUser() {
    $('#loadingViewSpinner').show();
    UserService.user($stateParams.id)
    .then(function success(data) {
      var user = new UserViewModel(data);
      $scope.user = user;
      $scope.formValues.Administrator = user.RoleId === 1 ? true : false;
    })
    .catch(function error(err) {
      Messages.error("Failure", err, 'Unable to retrieve user information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  getUser();
}]);
