import { isAgentEnvironment, isLocalEnvironment } from '@/react/portainer/environments/utils';

export default class porImageRegistryContainerController {
  /* @ngInject */
  constructor(DockerHubService, Notifications) {
    this.DockerHubService = DockerHubService;
    this.Notifications = Notifications;

    this.pullRateLimits = null;
  }

  $onChanges({ registryId }) {
    if (registryId) {
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
    if (!isAgentEnvironment(this.endpoint.Type) && !isLocalEnvironment(this.endpoint)) {
      this.setValidity(true);
      return;
    }

    try {
      this.pullRateLimits = await this.DockerHubService.checkRateLimits(this.endpoint, this.registryId || 0);
      this.setValidity(!this.pullRateLimits.limit || (this.pullRateLimits.limit && this.pullRateLimits.remaining >= 0));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed loading DockerHub pull rate limits', e);
      this.setValidity(true);
    }
  }
}
