import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';

export default class BoxSelectorItemController {
  /* @ngInject */
  constructor() {
    this.limitedToBE = false;
  }

  handleChange(value) {
    this.formCtrl.$setValidity(this.radioName, !this.limitedToBE, this.formCtrl);
    this.onChange(value);
  }

  $onInit() {
    if (this.option.feature) {
      this.limitedToBE = isLimitedToBE(this.option.feature);
    }
  }

  $onDestroy() {
    this.formCtrl.$setValidity(this.radioName, true, this.formCtrl);
  }
}
