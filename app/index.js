import './assets/css';

import './i18n';

import angular from 'angular';
import { UI_ROUTER_REACT_HYBRID } from '@uirouter/react-hybrid';

import './matomo-setup';
import analyticsModule from './angulartics.matomo';

import './agent';
import { azureModule } from './azure';
import './docker/__module';
import './edge/__module';
import './portainer/__module';

import { onStartupAngular } from './app';
import { configApp } from './config';

import { init as initFeatureService } from './portainer/feature-flags/feature-flags.service';
import { Edition } from './portainer/feature-flags/enums';
import { nomadModule } from './nomad';

initFeatureService(Edition[process.env.PORTAINER_EDITION]);

angular
  .module('portainer', [
    'ui.bootstrap',
    'ui.router',
    UI_ROUTER_REACT_HYBRID,
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
    azureModule,
    'portainer.docker',
    'portainer.kubernetes',
    nomadModule,
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
