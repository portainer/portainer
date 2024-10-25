import './assets/css';

import './i18n';

import angular from 'angular';
import { UI_ROUTER_REACT_HYBRID } from '@uirouter/react-hybrid';

import './matomo-setup';

import { Edition } from '@/react/portainer/feature-flags/enums';
import { init as initFeatureService } from '@/react/portainer/feature-flags/feature-flags.service';

import analyticsModule from './angulartics.matomo';
import './agent';
import { azureModule } from './azure';
import './docker/__module';
import './edge/__module';
import './portainer/__module';

import { onStartupAngular } from './app';
import { configApp } from './config';
import { constantsModule } from './ng-constants';

// http://localhost:49000 is a docker extension specific url (see /build/docker-extension/docker-compose.yml)
if (window.origin == 'http://localhost:49000') {
  // we are loading the app from a local file as in docker extension
  document.getElementById('base').href = 'http://localhost:49000/';

  window.ddExtension = true;
} else {
  var path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  var basePath = path ? '/' + path + '/' : '/';
  document.getElementById('base').href = basePath;
}

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
    'angular-loading-bar',
    'angular-clipboard',
    'ngFileSaver',
    'luegg.directives',
    'portainer.app',
    'portainer.agent',
    azureModule,
    'portainer.docker',
    'portainer.kubernetes',
    'portainer.edge',
    'rzModule',
    'moment-picker',
    'angulartics',
    analyticsModule,
    constantsModule,
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
