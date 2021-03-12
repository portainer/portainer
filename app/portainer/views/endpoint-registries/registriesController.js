import { RegistryViewModel } from '../../models/registry';

class EndpointRegistriesController {
  /* @ngInject */
  constructor($async, Notifications, EndpointProvider, Authentication) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.Authentication = Authentication;
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        viewReady: false,
      };

      try {
        // fake registry
        const registry = {
          Authentication: false,
          AuthorizedTeams: null,
          AuthorizedUsers: null,
          Checked: false,
          Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
          Id: 1,
          Name: 'fake-registry',
          Password: undefined,
          TeamAccessPolicies: {},
          Type: 3,
          URL: 'docker.io',
          UserAccessPolicies: {},
          Username: '',
        };
        this.registries = [];
        this.registries.push(new RegistryViewModel(registry));
        // end fake registry
        this.endpointType = this.EndpointProvider.currentEndpoint().Type;
        this.isAdmin = this.Authentication.isAdmin();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registries');
      } finally {
        this.state.viewReady = true;
      }
    });
  }
}

export default EndpointRegistriesController;
angular.module('portainer.app').controller('EndpointRegistriesController', EndpointRegistriesController);
