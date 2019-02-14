angular.module('portainer.extensions.oauth').component('oauthSettings', {
  templateUrl: 'app/extensions/oauth/components/oauth-settings/oauth-settings.html',
  bindings: {
    settings: '=',
    teams: '<'
  },
  controller: 'OAuthSettingsController'
});
