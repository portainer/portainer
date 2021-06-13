import EndpointHelper from 'Portainer/helpers/endpointHelper';

export default class porImageRegistryContainerController {
  /* @ngInject */
  constructor(DockerHubService, Notifications) {
    this.DockerHubService = DockerHubService;
    this.Notifications = Notifications;

    this.pullRateLimits = null;
  }

  $onChanges({ registry }) {
    if (registry && registry.currentValue && this.isDockerHubRegistry) {
      this.fetchRateLimits();
    }
  }

  $onInit() {
    this.setValidity =
      this.setValidity ||
      (() => {
        /* noop */
      });
  }

  async fetchRateLimits() {
    this.pullRateLimits = null;
    if (EndpointHelper.isAgentEndpoint(this.endpoint) || EndpointHelper.isLocalEndpoint(this.endpoint)) {
      try {
        this.pullRateLimits = await this.DockerHubService.checkRateLimits(this.endpoint, this.registry.Id);
        this.setValidity(this.pullRateLimits.remaining >= 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed loading DockerHub pull rate limits', e);
        this.setValidity(true);
      }
    } else {
      this.setValidity(true);
    }
  }
}
