import { STATES } from '@/portainer/feature-flags/enums';

const BE_URL = 'https://www.portainer.io/business-upsell?from=';

export default class BeIndicatorController {
  /* @ngInject */
  constructor(featureService) {
    Object.assign(this, { featureService });

    this.limitedToBE = false;
  }

  $onInit() {
    if (this.feature) {
      this.url = `${BE_URL}${this.feature}`;
      const state = this.featureService.selectShow(this.feature);

      this.limitedToBE = state === STATES.LIMITED_BE;
    }
  }
}
