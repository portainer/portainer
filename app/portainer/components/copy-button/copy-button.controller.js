export default class CopyButtonController {
  /* @ngInject */
  constructor(clipboard) {
    this.clipboard = clipboard;
    this.state = { isFading: false };
  }

  copyValueText() {
    this.clipboard.copyText(this.value);
    this.state.isFading = true;
    setTimeout(() => (this.state.isFading = false), 1000);
  }
}
