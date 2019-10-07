import '../assets/css/app.css';
import './libraries/isteven-angular-multiselect/isteven-multi-select.css';
import angular from 'angular';

import './agent/_module';
import './azure/_module';
import './docker/__module';
import './portainer/__module';

angular.module('portainer', [
  'ui.bootstrap',
  'ui.router',
  'ui.select',
  'isteven-multi-select',
  'ngCookies',
  'ngSanitize',
  'ngFileUpload',
  'ngMessages',
  'ngResource',
  'angularUtils.directives.dirPagination',
  'LocalStorageModule',
  'angular-jwt',
  'angular-google-analytics',
  'angular-json-tree',
  'angular-loading-bar',
  'angular-clipboard',
  'ngFileSaver',
  'luegg.directives',
  'portainer.app',
  'portainer.agent',
  'portainer.azure',
  'portainer.docker',
  'portainer.extensions',
  'portainer.integrations',
  'rzModule',
  'moment-picker'
]);

if (require) {
  var req = require.context('./', true, /^(.*\.(js$))[^.]*$/im);
  req.keys().forEach(function(key) {
    req(key);
  });
}
