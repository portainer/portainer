angular.module('portainer.app').component('changePasswordForm', {
  templateUrl:
    'app/portainer/components/change-password-form/change-password-form.html',
  controller: 'ChangePasswordFormController',
  bindings: {
    needToSanitizePassword: '<'
  }
});
