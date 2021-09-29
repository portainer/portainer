export default class BoxSelectorItemController {
  /* @ngInject */
  constructor(featureService) {
    Object.assign(this, { featureService });

    this.limitedToBE = false;
  }

  $onInit() {
    if (this.option.feature) {
      this.limitedToBE = this.featureService.isLimitedToBE(this.option.feature);
    }
  }
}
