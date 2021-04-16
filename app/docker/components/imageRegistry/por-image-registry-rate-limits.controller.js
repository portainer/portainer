export default class porImageRegistryContainerController {
  /* @ngInject */
  constructor(EndpointHelper, DockerHubService, Notifications) {
    this.EndpointHelper = EndpointHelper;
    this.DockerHubService = DockerHubService;
    this.Notifications = Notifications;

    this.pullRateLimits = null;
  }

  $onChanges({ isDockerHubRegistry }) {
    if (isDockerHubRegistry && isDockerHubRegistry.currentValue) {
      this.fetchRateLimits();
    }
  }

  async fetchRateLimits() {
    this.pullRateLimits = null;
    if (this.EndpointHelper.isAgentEndpoint(this.endpoint) || this.EndpointHelper.isLocalEndpoint(this.endpoint)) {
      try {
        this.pullRateLimits = await this.DockerHubService.checkRateLimits(this.endpoint);
        this.setValidity(this.pullRateLimits.remaining >= 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed loading DockerHub pull rate limits', e);
      }
    } else {
      this.setValidity(true);
    }
  }
}
