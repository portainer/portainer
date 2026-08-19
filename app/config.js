import { agentInterceptor } from '@/react/portainer/services/axios/axios';
import { dispatchCacheRefreshEventIfNeeded } from './portainer/services/http-request.helper';

/* @ngInject */
export function configApp($urlRouterProvider, $httpProvider, localStorageServiceProvider, $uibTooltipProvider, $compileProvider, cfpLoadingBarProvider) {
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

  $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
  $httpProvider.defaults.headers.put['Content-Type'] = 'application/json';
  $httpProvider.defaults.headers.patch['Content-Type'] = 'application/json';

  $httpProvider.interceptors.push(() => ({
    request: agentInterceptor,
  }));

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
