angular.module('portainer.oauth').controller('OAuthSettingsController', function OAuthSettingsController() {
  var ctrl = this;

  this.state = {
    provider: {},
  };

  this.$onInit = $onInit;

  function $onInit() {
    if (ctrl.settings.RedirectURI === '') {
      ctrl.settings.RedirectURI = window.location.origin;
    }

    if (ctrl.settings.AuthorizationURI !== '') {
      ctrl.state.provider.authUrl = ctrl.settings.AuthorizationURI;
    }
  }
});
