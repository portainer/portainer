import { STATES } from '@/portainer/feature-flags/enums';

export default class BoxSelectorItemController {
  /* @ngInject */
  constructor(featureService) {
    Object.assign(this, { featureService });

    this.limitedToBE = false;
  }

  $onInit() {
    if (this.option.feature) {
      const state = this.featureService.selectShow(this.option.feature);

      this.limitedToBE = state === STATES.LIMITED_BE;
    }
  }
}
