class EndpointRegistriesController {
  /* @ngInject */
  constructor($async, Notifications) {
    this.$async = $async;
    this.Notifications = Notifications;
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        viewReady: false,
      };

      try {
        //
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
