import featureFlagModule from '@/react/portainer/feature-flags';

import './rbac';

import componentsModule from './components';
import settingsModule from './settings';
import userActivityModule from './user-activity';
import servicesModule from './services';
import { reactModule } from './react';
import { sidebarModule } from './react/views/sidebar';
import environmentsModule from './environments';
import { helpersModule } from './helpers';
import { AccessHeaders, requiresAuthHook } from './authorization-guard';

async function initAuthentication(Authentication) {
  return await Authentication.init();
}

angular
  .module('portainer.app', [
    'portainer.oauth',
    'portainer.rbac',
    'portainer.registrymanagement',
    componentsModule,
    settingsModule,
    featureFlagModule,
    userActivityModule,
    servicesModule,
    reactModule,
    sidebarModule,
    environmentsModule,
    helpersModule,
  ])
  .config([
    '$stateRegistryProvider',
    function ($stateRegistryProvider) {
      var root = {
        name: 'root',
        abstract: true,
        onEnter: /* @ngInject */ function onEnter($async, StateManager, Authentication, Notifications, $state) {
          return $async(async () => {
            const appState = StateManager.getState();
            if (!appState.loading) {
              return;
            }
            try {
              const loggedIn = await initAuthentication(Authentication);
              await StateManager.initialize();
              if (!loggedIn && isTransitionRequiresAuthentication($state.transition)) {
                $state.go('portainer.logout');
                return Promise.reject('Unauthenticated');
              }
            } catch (err) {
              Notifications.error('Failure', err, 'Unable to retrieve application settings');
              throw err;
            }
          });
        },
        views: {
          'sidebar@': {
            component: 'sidebar',
          },
        },
        data: {
          access: AccessHeaders.Restricted,
        },
      };

      var endpointRoot = {
        name: 'endpoint',
        url: '/:endpointId',
        parent: 'root',
        abstract: true,
        resolve: {
          endpoint: /* @ngInject */ function endpoint($async, $state, $transition$, EndpointProvider, EndpointService, Notifications) {
            return $async(async () => {
              try {
                const endpointId = +$transition$.params().endpointId;

                const endpoint = await EndpointService.endpoint(endpointId);
                if ((endpoint.Type === 4 || endpoint.Type === 7) && !endpoint.EdgeID) {
                  $state.go('portainer.endpoints.endpoint', { id: endpoint.Id });
                  return;
                }

                EndpointProvider.setCurrentEndpoint(endpoint);

                return endpoint;
              } catch (e) {
                Notifications.error('Failed loading environment', e);
                $state.go('portainer.home', {}, { reload: true });
                return;
              }
            });
          },
        },
      };

      var portainer = {
        name: 'portainer',
        parent: 'root',
        abstract: true,
      };

      var account = {
        name: 'portainer.account',
        url: '/account',
        views: {
          'content@': {
            templateUrl: './views/account/account.html',
            controller: 'AccountController',
          },
        },
        data: {
          docs: '/user/account-settings',
        },
      };

      const tokenCreation = {
        name: 'portainer.account.new-access-token',
        url: '/tokens/new',
        views: {
          'content@': {
            component: 'createUserAccessToken',
          },
        },
      };

      const createHelmRepository = {
        name: 'portainer.account.createHelmRepository',
        url: '/helm-repository/new',
        views: {
          'content@': {
            component: 'createHelmRepositoryView',
          },
        },
      };

      var authentication = {
        name: 'portainer.auth',
        url: '/auth',
        params: {
          reload: false,
        },
        views: {
          'content@': {
            templateUrl: './views/auth/auth.html',
            controller: 'AuthenticationController',
            controllerAs: 'ctrl',
          },
          'sidebar@': {},
        },
        data: {
          access: undefined,
        },
      };

      const logout = {
        name: 'portainer.logout',
        url: '/logout',
        params: {
          error: '',
        },
        views: {
          'content@': {
            templateUrl: './views/logout/logout.html',
            controller: 'LogoutController',
            controllerAs: 'ctrl',
          },
          'sidebar@': {},
        },
        data: {
          access: undefined,
        },
      };

      var endpoints = {
        name: 'portainer.endpoints',
        url: '/endpoints',
        views: {
          'content@': {
            component: 'environmentsListView',
          },
        },
        data: {
          docs: '/admin/environments/environments',
        },
      };

      var endpoint = {
        name: 'portainer.endpoints.endpoint',
        url: '/:id?redirectTo',
        params: {
          redirectTo: '',
        },
        views: {
          'content@': {
            templateUrl: './views/endpoints/edit/endpoint.html',
            controller: 'EndpointController',
          },
        },
      };

      const edgeAutoCreateScript = {
        name: 'portainer.endpoints.edgeAutoCreateScript',
        url: '/aeec',
        views: {
          'content@': {
            component: 'edgeAutoCreateScriptView',
          },
        },
        data: {
          docs: '/admin/environments/aeec',
        },
      };

      var endpointAccess = {
        name: 'portainer.endpoints.endpoint.access',
        url: '/access',
        views: {
          'content@': {
            templateUrl: './views/endpoints/access/endpointAccess.html',
            controller: 'EndpointAccessController',
            controllerAs: 'ctrl',
          },
        },
      };

      var endpointKVM = {
        name: 'portainer.endpoints.endpoint.kvm',
        url: '/kvm?deviceId&deviceName',
        views: {
          'content@': {
            templateUrl: './views/endpoints/kvm/endpointKVM.html',
            controller: 'EndpointKVMController',
          },
        },
      };

      var groups = {
        name: 'portainer.groups',
        url: '/groups',
        views: {
          'content@': {
            component: 'environmentGroupsListView',
          },
        },
        data: {
          docs: '/admin/environments/groups',
          access: AccessHeaders.Admin,
        },
      };

      var group = {
        name: 'portainer.groups.group',
        url: '/:id',
        views: {
          'content@': {
            templateUrl: './views/groups/edit/group.html',
            controller: 'GroupController',
          },
        },
      };

      var groupCreation = {
        name: 'portainer.groups.new',
        url: '/new',
        views: {
          'content@': {
            templateUrl: './views/groups/create/creategroup.html',
            controller: 'CreateGroupController',
          },
        },
      };

      var groupAccess = {
        name: 'portainer.groups.group.access',
        url: '/access',
        views: {
          'content@': {
            templateUrl: './views/groups/access/groupAccess.html',
            controller: 'GroupAccessController',
          },
        },
      };

      var home = {
        name: 'portainer.home',
        url: '/home?redirect&environmentId&environmentName&route',
        views: {
          'content@': {
            component: 'homeView',
          },
        },
        data: {
          docs: '/user/home',
        },
      };

      var init = {
        name: 'portainer.init',
        abstract: true,
        url: '/init',
        views: {
          'sidebar@': {},
        },
        data: {
          access: undefined,
        },
      };

      var initAdmin = {
        name: 'portainer.init.admin',
        url: '/admin',
        views: {
          'content@': {
            templateUrl: './views/init/admin/initAdmin.html',
            controller: 'InitAdminController',
          },
        },
      };

      var settings = {
        name: 'portainer.settings',
        url: '/settings',
        views: {
          'content@': {
            component: 'settingsView',
          },
        },
        data: {
          docs: '/admin/settings',
          access: AccessHeaders.Admin,
        },
      };

      var settingsAuthentication = {
        name: 'portainer.settings.authentication',
        url: '/auth',
        views: {
          'content@': {
            templateUrl: './views/settings/authentication/settingsAuthentication.html',
            controller: 'SettingsAuthenticationController',
          },
        },
        data: {
          docs: '/admin/settings/authentication',
        },
      };

      var settingsEdgeCompute = {
        name: 'portainer.settings.edgeCompute',
        url: '/edge',
        views: {
          'content@': {
            component: 'settingsEdgeComputeView',
          },
        },
        data: {
          docs: '/admin/settings/edge',
        },
      };

      var tags = {
        name: 'portainer.tags',
        url: '/tags',
        views: {
          'content@': {
            templateUrl: './views/tags/tags.html',
            controller: 'TagsController',
          },
        },
        data: {
          docs: '/admin/environments/tags',
          access: AccessHeaders.Admin,
        },
      };

      var users = {
        name: 'portainer.users',
        url: '/users',
        views: {
          'content@': {
            component: 'usersListView',
          },
        },
        data: {
          docs: '/admin/user/users',
          access: AccessHeaders.Restricted, // allow for team leaders
        },
      };

      var user = {
        name: 'portainer.users.user',
        url: '/:id',
        views: {
          'content@': {
            templateUrl: './views/users/edit/user.html',
            controller: 'UserController',
          },
        },
      };

      $stateRegistryProvider.register(root);
      $stateRegistryProvider.register(endpointRoot);
      $stateRegistryProvider.register(portainer);
      $stateRegistryProvider.register(account);
      $stateRegistryProvider.register(tokenCreation);
      $stateRegistryProvider.register(authentication);
      $stateRegistryProvider.register(logout);
      $stateRegistryProvider.register(endpoints);
      $stateRegistryProvider.register(endpoint);
      $stateRegistryProvider.register(endpointAccess);
      $stateRegistryProvider.register(endpointKVM);
      $stateRegistryProvider.register(edgeAutoCreateScript);
      $stateRegistryProvider.register(groups);
      $stateRegistryProvider.register(group);
      $stateRegistryProvider.register(groupAccess);
      $stateRegistryProvider.register(groupCreation);
      $stateRegistryProvider.register(home);
      $stateRegistryProvider.register(init);
      $stateRegistryProvider.register(initAdmin);
      $stateRegistryProvider.register(settings);
      $stateRegistryProvider.register(settingsAuthentication);
      $stateRegistryProvider.register(settingsEdgeCompute);
      $stateRegistryProvider.register(tags);
      $stateRegistryProvider.register(users);
      $stateRegistryProvider.register(user);
      $stateRegistryProvider.register(createHelmRepository);
    },
  ])
  .run(run);

function isTransitionRequiresAuthentication(transition) {
  const UNAUTHENTICATED_ROUTES = ['portainer.logout', 'portainer.auth'];
  if (!transition) {
    return true;
  }
  const nextTransition = transition && transition.to();
  const nextTransitionName = nextTransition ? nextTransition.name : '';
  return !UNAUTHENTICATED_ROUTES.some((route) => nextTransitionName.startsWith(route));
}

/* @ngInject */
function run($transitions) {
  requiresAuthHook($transitions);
}
