import angular from 'angular';
import controller from './oauth-provider-selector.controller';

angular.module('portainer.oauth').component('oauthProvidersSelector', {
  templateUrl: './oauth-providers-selector.html',
  bindings: {
    onChange: '<',
    value: '<',
  },
  controller,
});
