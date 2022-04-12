import _ from 'lodash-es';

import './rbac';
import componentsModule from './components';
import settingsModule from './settings';
import featureFlagModule from './feature-flags';
import userActivityModule from './user-activity';
import servicesModule from './services';
import teamsModule from './teams';
import homeModule from './home';
import { accessControlModule } from './access-control';

async function initAuthentication(authManager, Authentication, $rootScope, $state) {
  authManager.checkAuthOnRefresh();
  // The unauthenticated event is broadcasted by the jwtInterceptor when
  // hitting a 401. We're using this instead of the usual combination of
  // authManager.redirectWhenUnauthenticated() + unauthenticatedRedirector
  // to have more controls on which URL should trigger the unauthenticated state.
  $rootScope.$on('unauthenticated', function (event, data) {
    if (!_.includes(data.config.url, '/v2/') && !_.includes(data.config.url, '/api/v4/') && isTransitionRequiresAuthentication($state.transition)) {
      $state.go('portainer.logout', { error: 'Your session has expired' });
    }
  });

  return await Authentication.init();
}

angular
  .module('portainer.app', [
    homeModule,
    'portainer.oauth',
    'portainer.rbac',
    componentsModule,
    settingsModule,
    featureFlagModule,
    userActivityModule,
    'portainer.shared.datatable',
    servicesModule,
    teamsModule,
    accessControlModule,
  ])
  .config([
    '$stateRegistryProvider',
    function ($stateRegistryProvider) {
      var root = {
        name: 'root',
        abstract: true,
        onEnter: /* @ngInject */ function onEnter($async, StateManager, Authentication, Notifications, authManager, $rootScope, $state) {
          return $async(async () => {
            const appState = StateManager.getState();
            if (!appState.loading) {
              return;
            }
            try {
              const loggedIn = await initAuthentication(authManager, Authentication, $rootScope, $state);
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
            templateUrl: './views/sidebar/sidebar.html',
            controller: 'SidebarController',
          },
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
      };
      const logout = {
        name: 'portainer.logout',
        url: '/logout',
        params: {
          error: '',
          performApiLogout: false,
        },
        views: {
          'content@': {
            templateUrl: './views/logout/logout.html',
            controller: 'LogoutController',
            controllerAs: 'ctrl',
          },
          'sidebar@': {},
        },
      };

      var endpoints = {
        name: 'portainer.endpoints',
        url: '/endpoints',
        views: {
          'content@': {
            templateUrl: './views/endpoints/endpoints.html',
            controller: 'EndpointsController',
          },
        },
      };

      var endpoint = {
        name: 'portainer.endpoints.endpoint',
        url: '/:id',
        views: {
          'content@': {
            templateUrl: './views/endpoints/edit/endpoint.html',
            controller: 'EndpointController',
          },
        },
      };

      var k8sendpoint = {
        name: 'portainer.k8sendpoint',
        url: '/:id',
      };

      const endpointKubernetesConfiguration = {
        name: 'portainer.k8sendpoint.kubernetesConfig',
        url: '/configure',
        views: {
          'content@': {
            templateUrl: '../kubernetes/views/configure/configure.html',
            controller: 'KubernetesConfigureController',
            controllerAs: 'ctrl',
          },
        },
      };

      var endpointCreation = {
        name: 'portainer.endpoints.new',
        url: '/new',
        views: {
          'content@': {
            templateUrl: './views/endpoints/create/createendpoint.html',
            controller: 'CreateEndpointController',
          },
        },
      };

      var edgeDeviceCreation = {
        name: 'portainer.endpoints.newEdgeDevice',
        url: '/newEdgeDevice',
        params: {
          isEdgeDevice: true,
        },
        views: {
          'content@': {
            templateUrl: './views/endpoints/create/createendpoint.html',
            controller: 'CreateEndpointController',
          },
        },
      };

      var deviceImport = {
        name: 'portainer.endpoints.importDevice',
        url: '/device',
        views: {
          'content@': {
            templateUrl: './views/devices/import/importDevice.html',
            controller: 'ImportDeviceController',
          },
        },
      };

      var addFDOProfile = {
        name: 'portainer.endpoints.profile',
        url: '/profile',
        views: {
          'content@': {
            component: 'addProfileView',
          },
        },
      };

      var editFDOProfile = {
        name: 'portainer.endpoints.profile.edit',
        url: '/:id',
        views: {
          'content@': {
            component: 'editProfileView',
          },
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
            templateUrl: './views/groups/groups.html',
            controller: 'GroupsController',
          },
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
        url: '/home',
        views: {
          'content@': {
            component: 'homeView',
          },
        },
      };

      var init = {
        name: 'portainer.init',
        abstract: true,
        url: '/init',
        views: {
          'sidebar@': {},
        },
      };

      const wizard = {
        name: 'portainer.wizard',
        url: '/wizard',
        views: {
          'content@': {
            component: 'wizardView',
          },
        },
      };

      const wizardEndpoints = {
        name: 'portainer.wizard.endpoints',
        url: '/endpoints',
        views: {
          'content@': {
            component: 'wizardEndpoints',
          },
        },
      };

      var initEndpoint = {
        name: 'portainer.init.endpoint',
        url: '/endpoint',
        views: {
          'content@': {
            templateUrl: './views/init/endpoint/initEndpoint.html',
            controller: 'InitEndpointController',
            controllerAs: 'ctrl',
          },
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

      var registries = {
        name: 'portainer.registries',
        url: '/registries',
        views: {
          'content@': {
            templateUrl: './views/registries/registries.html',
            controller: 'RegistriesController',
          },
        },
      };

      var registry = {
        name: 'portainer.registries.registry',
        url: '/:id',
        views: {
          'content@': {
            component: 'editRegistry',
          },
        },
      };

      const registryCreation = {
        name: 'portainer.registries.new',
        url: '/new',
        views: {
          'content@': {
            component: 'createRegistry',
          },
        },
      };

      var settings = {
        name: 'portainer.settings',
        url: '/settings',
        views: {
          'content@': {
            templateUrl: './views/settings/settings.html',
            controller: 'SettingsController',
          },
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
      };

      var settingsEdgeCompute = {
        name: 'portainer.settings.edgeCompute',
        url: '/edge',
        views: {
          'content@': {
            component: 'settingsEdgeComputeView',
          },
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
      };

      var users = {
        name: 'portainer.users',
        url: '/users',
        views: {
          'content@': {
            templateUrl: './views/users/users.html',
            controller: 'UsersController',
          },
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

      var teams = {
        name: 'portainer.teams',
        url: '/teams',
        views: {
          'content@': {
            templateUrl: './views/teams/teams.html',
            controller: 'TeamsController',
          },
        },
      };

      var team = {
        name: 'portainer.teams.team',
        url: '/:id',
        views: {
          'content@': {
            templateUrl: './views/teams/edit/team.html',
            controller: 'TeamController',
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
      $stateRegistryProvider.register(k8sendpoint);
      $stateRegistryProvider.register(endpointAccess);
      $stateRegistryProvider.register(endpointKVM);
      $stateRegistryProvider.register(edgeDeviceCreation);
      $stateRegistryProvider.register(endpointCreation);
      $stateRegistryProvider.register(deviceImport);
      $stateRegistryProvider.register(addFDOProfile);
      $stateRegistryProvider.register(editFDOProfile);
      $stateRegistryProvider.register(endpointKubernetesConfiguration);
      $stateRegistryProvider.register(groups);
      $stateRegistryProvider.register(group);
      $stateRegistryProvider.register(groupAccess);
      $stateRegistryProvider.register(groupCreation);
      $stateRegistryProvider.register(home);
      $stateRegistryProvider.register(init);
      $stateRegistryProvider.register(wizard);
      $stateRegistryProvider.register(wizardEndpoints);
      $stateRegistryProvider.register(initEndpoint);
      $stateRegistryProvider.register(initAdmin);
      $stateRegistryProvider.register(registries);
      $stateRegistryProvider.register(registry);
      $stateRegistryProvider.register(registryCreation);
      $stateRegistryProvider.register(settings);
      $stateRegistryProvider.register(settingsAuthentication);
      $stateRegistryProvider.register(settingsEdgeCompute);
      $stateRegistryProvider.register(tags);
      $stateRegistryProvider.register(users);
      $stateRegistryProvider.register(user);
      $stateRegistryProvider.register(teams);
      $stateRegistryProvider.register(team);
    },
  ]);

function isTransitionRequiresAuthentication(transition) {
  const UNAUTHENTICATED_ROUTES = ['portainer.logout', 'portainer.auth'];
  if (!transition) {
    return true;
  }
  const nextTransition = transition && transition.to();
  const nextTransitionName = nextTransition ? nextTransition.name : '';
  return !UNAUTHENTICATED_ROUTES.some((route) => nextTransitionName.startsWith(route));
}
