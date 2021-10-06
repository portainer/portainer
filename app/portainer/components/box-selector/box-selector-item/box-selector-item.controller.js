export default class BoxSelectorItemController {
  /* @ngInject */
  constructor(featureService) {
    Object.assign(this, { featureService });

    this.limitedToBE = false;
  }

  handleChange(value) {
    this.formCtrl.$setValidity(this.radioName, !this.limitedToBE, this.formCtrl);
    this.onChange(value);
  }

  $onInit() {
    if (this.option.feature) {
      this.limitedToBE = this.featureService.isLimitedToBE(this.option.feature);
    }
  }

  $onDestroy() {
    this.formCtrl.$setValidity(this.radioName, true, this.formCtrl);
  }
}
