export default class OptionPanelController {
  /* @ngInject */
  constructor() {
    this.switchPruneService = this.switchPruneService.bind(this);
  }

  switchPruneService() {
    this.onChange(this.ngModel);
  }
}
