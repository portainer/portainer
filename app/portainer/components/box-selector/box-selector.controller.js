export default class BoxSelectorController {
  constructor() {
    this.isChecked = this.isChecked.bind(this);
    this.change = this.change.bind(this);
  }

  change(value, limited) {
    this.ngModel = value;
    if (this.onChange) {
      this.onChange(value, limited);
    }
  }

  isChecked(value) {
    return this.ngModel === value;
  }
}
