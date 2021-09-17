import { STATES } from '@/portainer/feature-flags/enums';

export default class PorSwitchController {
  /* @ngInject */
  constructor(featureService) {
    Object.assign(this, { featureService });

    this.limitedToBE = false;
  }

  $onInit() {
    if (this.feature) {
      const state = this.featureService.selectShow(this.feature);

      this.limitedToBE = state === STATES.LIMITED_BE;
    }
  }
}
