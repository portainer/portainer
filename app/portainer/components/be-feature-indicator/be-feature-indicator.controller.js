import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';

const BE_URL = 'https://www.portainer.io/business-upsell?from=';

export default class BeIndicatorController {
  /* @ngInject */
  constructor() {
    this.limitedToBE = false;
  }

  $onInit() {
    if (this.feature) {
      this.url = `${BE_URL}${this.feature}`;

      this.limitedToBE = isLimitedToBE(this.feature);
    }
  }
}
