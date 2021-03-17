class EndpointRegistriesController {
  /* @ngInject */
  constructor($async, Notifications, EndpointProvider, Authentication, RegistryService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.Authentication = Authentication;
    this.RegistryService = RegistryService;

    this.getRegistriesAsync = this.getRegistriesAsync.bind(this);
  }

  async getRegistriesAsync() {
    try {
      this.registries = await this.RegistryService.registries(this.endpointId);
    } catch (err) {
      this.Notifications.Error('Failure', err, 'Unable to retrieve registries');
    }
  }

  getRegistries() {
    return this.$async(this.getRegistriesAsync);
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        viewReady: false,
      };

      try {
        const endpoint = this.EndpointProvider.currentEndpoint();
        this.endpointType = endpoint.Type;
        this.endpointId = endpoint.Id;
        await this.getRegistries();
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
