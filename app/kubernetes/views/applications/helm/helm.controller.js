import PortainerError from 'Portainer/error';

export default class KubernetesHelmApplicationController {
  /* @ngInject */
  constructor($async, $state, Authentication, Notifications, HelmService) {
    this.$async = $async;
    this.$state = $state;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.HelmService = HelmService;
  }

  /**
   * APPLICATION
   */
  async getHelmApplication() {
    try {
      this.state.dataLoading = true;
      const releases = await this.HelmService.listReleases(this.endpoint.Id, { selector: `name=${this.state.params.name}`, namespace: this.state.params.namespace });
      if (releases.length > 0) {
        this.state.release = releases[0];
      } else {
        throw new PortainerError(`Release ${this.state.params.name} not found`);
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm application details');
    } finally {
      this.state.dataLoading = false;
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        dataLoading: true,
        viewReady: false,
        params: {
          name: this.$state.params.name,
          namespace: this.$state.params.namespace,
        },
        release: {
          name: undefined,
          chart: undefined,
          app_version: undefined,
        },
      };

      await this.getHelmApplication();
      this.state.viewReady = true;
    });
  }
}
