import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';

export default class PorSwitchController {
  /* @ngInject */
  constructor() {
    Object.assign(this, {});

    this.limitedToBE = false;
  }

  $onInit() {
    if (this.feature) {
      this.limitedToBE = isLimitedToBE(this.feature);
    }
  }
}
