import './assets/css';

import './i18n';

import angular from 'angular';
import { UI_ROUTER_REACT_HYBRID } from '@uirouter/react-hybrid';

import './matomo-setup';
import analyticsModule from './angulartics.matomo';

import './agent';
import './azure/_module';
import './docker/__module';
import './edge/__module';
import './portainer/__module';

import { onStartupAngular } from './app';
import { configApp } from './config';

import { init as initFeatureService } from './portainer/feature-flags/feature-flags.service';
import { Edition } from './portainer/feature-flags/enums';

initFeatureService(Edition[process.env.PORTAINER_EDITION]);

angular
  .module('portainer', [
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
    'rzModule',
    'moment-picker',
    'angulartics',
    analyticsModule,
  ])
  .run(onStartupAngular)
  .config(configApp);

if (require) {
  const req = require.context('./', true, /^(.*\.(js$))[^.]*$/im);
  req
    .keys()
    .filter((path) => !path.includes('.test'))
    .forEach(function (key) {
      req(key);
    });
}
