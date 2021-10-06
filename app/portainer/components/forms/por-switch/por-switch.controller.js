export default class PorSwitchController {
  /* @ngInject */
  constructor(featureService) {
    Object.assign(this, { featureService });

    this.limitedToBE = false;
  }

  $onInit() {
    if (this.feature) {
      this.limitedToBE = this.featureService.isLimitedToBE(this.feature);
    }
  }
}
