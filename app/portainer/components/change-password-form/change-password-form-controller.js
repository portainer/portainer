angular.module('portainer.app').controller('ChangePasswordFormController', [
  'Authentication', 'UserService', 'SettingsService', '$state', 'Notifications', '$sanitize',
  function ChangePasswordFormController(Authentication, UserService, SettingsService, $state, Notifications, $sanitize) {
    var ctrl = this;
    
    ctrl.state = {
      formValues: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      AuthenticationMethod: null,
      invalidPassword: false
    };

    ctrl.updatePassword = updatePassword;

    initView();

    function updatePassword() {
      ctrl.state.invalidPassword = false;
      var currentPassword = ctrl.state.formValues.currentPassword;
      var newPassword = ctrl.state.formValues.newPassword;

      if (ctrl.needToSanitizePassword) {
        currentPassword = $sanitize(currentPassword);
      }

      UserService.updateUserPassword(ctrl.userID, currentPassword, newPassword)
        .then(function success() {
          Notifications.success('Success', 'Password successfully updated');
          $state.go('portainer.home');
        })
        .catch(function error(err) {
          if (err.invalidPassword) {
            ctrl.state.invalidPassword = true;
          } else {
            Notifications.error('Failure', err, err.msg);
          }
        });
    }

    function initView() {
      ctrl.userID = Authentication.getUserDetails().ID;
      SettingsService.publicSettings()
        .then(function success(data) {
          ctrl.state.AuthenticationMethod = data.AuthenticationMethod;
        })
        .catch(function error(err) {
          Notifications.error(
            'Failure',
            err,
            'Unable to retrieve application settings'
          );
        });
    }
  }
]);
