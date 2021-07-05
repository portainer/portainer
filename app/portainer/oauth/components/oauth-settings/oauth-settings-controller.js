angular.module('portainer.oauth').controller('OAuthSettingsController', function OAuthSettingsController() {
  var ctrl = this;
  this.addAdminClaimRegex = addAdminClaimRegex;
  this.removeAdminClaimRegex = removeAdminClaimRegex;

  this.state = {
    provider: {},
  };

  this.$onInit = $onInit;

  function addAdminClaimRegex() {
    ctrl.settings.AdminGroupClaimsRegexList.push('');
  }

  function removeAdminClaimRegex(index) {
    ctrl.settings.AdminGroupClaimsRegexList.splice(index, 1);
  }

  function $onInit() {
    if (ctrl.settings.RedirectURI === '') {
      ctrl.settings.RedirectURI = window.location.origin;
    }

    if (ctrl.settings.AuthorizationURI !== '') {
      ctrl.state.provider.authUrl = ctrl.settings.AuthorizationURI;
    }

    if (ctrl.settings.DefaultTeamID === 0) {
      ctrl.settings.DefaultTeamID = null;
    }

    ctrl.settings.AdminGroupClaimsRegexList = [];
  }
});
