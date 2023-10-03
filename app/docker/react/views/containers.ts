import { StateRegistry } from '@uirouter/angularjs';
import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { ListView } from '@/react/docker/containers/ListView';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { LogView } from '@/react/docker/containers/LogView';

export const containersModule = angular
  .module('portainer.docker.react.views.containers', [])
  .component(
    'containersView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(ListView))), ['endpoint'])
  )
  // the view only contains the information panel when logging is disabled
  // this is a temporary solution to avoid creating a publicly exposed component
  // or an AngularJS component until the logs view is migrated to React
  .component(
    'containerLogView',
    r2a(withUIRouter(withReactQuery(withCurrentUser(LogView))), [])
  )

  .config(config).name;

/* @ngInject */
function config($stateRegistryProvider: StateRegistry) {
  $stateRegistryProvider.register({
    name: 'docker.containers',
    url: '/containers',
    views: {
      'content@': {
        component: 'containersView',
      },
    },
    data: {
      docs: '/user/docker/containers',
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.container',
    url: '/:id?nodeName',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/edit/container.html',
        controller: 'ContainerController',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.container.attach',
    url: '/attach',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/console/attach.html',
        controller: 'ContainerConsoleController',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.container.exec',
    url: '/exec',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/console/exec.html',
        controller: 'ContainerConsoleController',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.new',
    url: '/new?nodeName&from',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/create/createcontainer.html',
        controller: 'CreateContainerController',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.container.inspect',
    url: '/inspect',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/inspect/containerinspect.html',
        controller: 'ContainerInspectController',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.container.logs',
    url: '/logs',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/logs/containerlogs.html',
        controller: 'ContainerLogsController',
      },
    },
  });

  $stateRegistryProvider.register({
    name: 'docker.containers.container.stats',
    url: '/stats',
    views: {
      'content@': {
        templateUrl: '~@/docker/views/containers/stats/containerstats.html',
        controller: 'ContainerStatsController',
      },
    },
  });
}
