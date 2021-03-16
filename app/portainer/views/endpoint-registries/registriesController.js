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
        // get registries
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
