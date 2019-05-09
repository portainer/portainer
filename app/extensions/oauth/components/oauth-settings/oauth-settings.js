angular.module('portainer.extensions.oauth').component('oauthSettings', {
  templateUrl: './oauth-settings.html',
  bindings: {
    settings: '=',
    teams: '<'
  },
  controller: 'OAuthSettingsController'
});
