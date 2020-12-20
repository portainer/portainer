export default class porImageRegistryContainerController {
  /* @ngInject */
  constructor($scope, EndpointHelper, DockerHubService) {
    this.EndpointHelper = EndpointHelper;
    this.DockerHubService = DockerHubService;

    $scope.$watch(
      () => this.model,
      (currentValue) => {
        if (currentValue) {
          this.fetchRateLimits();
        }
      },
      true
    );
  }

  async fetchRateLimits() {
    if (!this.checkRateLimits) {
      return;
    }
    this.pullRateLimits = null;
    if (this.isDockerHubRegistry && (this.EndpointHelper.isAgentEndpoint(this.endpoint) || this.EndpointHelper.isLocalEndpoint(this.endpoint))) {
      try {
        this.pullRateLimits = await this.DockerHubService.checkRateLimits(this.endpoint);
        this.setValidity(this.pullRateLimits.remaining >= 0);
      } catch (e) {
        this.Notifications.error('Failed loading dockerhub pull rate limits', e);
      }
    } else {
      this.setValidity(true);
    }
  }
}
