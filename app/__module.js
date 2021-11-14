import './assets/css';
import '@babel/polyfill';

import angular from 'angular';
import { UI_ROUTER_REACT_HYBRID } from '@uirouter/react-hybrid';

import './matomo-setup';
import analyticsModule from './angulartics.matomo';

import './agent';
import './azure/_module';
import './docker/__module';
import './edge/__module';
import './portainer/__module';

import { init as initFeatureService } from './portainer/feature-flags/feature-flags.service';
import { Edition } from './portainer/feature-flags/enums';

initFeatureService(Edition.CE);

angular.module('portainer', [
  'ui.bootstrap',
  'ui.router',
  UI_ROUTER_REACT_HYBRID,
  'ui.select',
  'isteven-multi-select',
  'ngSanitize',
  'ngFileUpload',
  'ngMessages',
  'ngResource',
  'angularUtils.directives.dirPagination',
  'LocalStorageModule',
  'angular-jwt',
  'angular-json-tree',
  'angular-loading-bar',
  'angular-clipboard',
  'ngFileSaver',
  'luegg.directives',
  'portainer.app',
  'portainer.agent',
  'portainer.azure',
  'portainer.docker',
  'portainer.kubernetes',
  'portainer.edge',
  'portainer.integrations',
  'rzModule',
  'moment-picker',
  'angulartics',
  analyticsModule,
]);

if (require) {
  var req = require.context('./', true, /^(.*\.(js$))[^.]*$/im);
  req
    .keys()
    .filter((path) => !path.includes('.test'))
    .forEach(function (key) {
      req(key);
    });
}
