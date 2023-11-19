import { Terminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import { agentInterceptor } from './portainer/services/axios';
import { dispatchCacheRefreshEventIfNeeded } from './portainer/services/http-request.helper';

/* @ngInject */
export function configApp($urlRouterProvider, $httpProvider, localStorageServiceProvider, jwtOptionsProvider, $uibTooltipProvider, $compileProvider, cfpLoadingBarProvider) {
  if (process.env.NODE_ENV === 'testing') {
    $compileProvider.debugInfoEnabled(false);
  }

  // ask to clear cache on mutation
  $httpProvider.interceptors.push(() => ({
    request: (reqConfig) => {
      dispatchCacheRefreshEventIfNeeded(reqConfig);
      return reqConfig;
    },
  }));

  localStorageServiceProvider.setPrefix('portainer');

  jwtOptionsProvider.config({
    tokenGetter: /* @ngInject */ function tokenGetter(LocalStorage) {
      return LocalStorage.getJWT();
    },
    whiteListedDomains: ['localhost'],
  });

  $httpProvider.interceptors.push('jwtInterceptor');

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
  $httpProvider.defaults.headers.put['Content-Type'] = 'application/json';
  $httpProvider.defaults.headers.patch['Content-Type'] = 'application/json';

  $httpProvider.interceptors.push(() => ({
    request: agentInterceptor,
  }));

  Terminal.applyAddon(fit);

  $uibTooltipProvider.setTriggers({
    mouseenter: 'mouseleave',
    click: 'click',
    focus: 'blur',
    outsideClick: 'outsideClick',
  });

  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.parentSelector = '#loadingbar-placeholder';
  cfpLoadingBarProvider.latencyThreshold = 600;

  $urlRouterProvider.otherwise('/auth');
}
