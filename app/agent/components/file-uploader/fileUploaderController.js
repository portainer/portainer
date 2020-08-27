export class FileUploaderController {
  /* @ngInject */
  constructor($async) {
    Object.assign(this, { $async });

    this.state = {
      uploadInProgress: false,
    };

    this.onFileSelected = this.onFileSelected.bind(this);
    this.onFileSelectedAsync = this.onFileSelectedAsync.bind(this);
  }

  onFileSelected(file) {
    return this.$async(this.onFileSelectedAsync, file);
  }

  async onFileSelectedAsync(file) {
    if (!file) {
      return;
    }

    this.state.uploadInProgress = true;
    try {
      await this.uploadFile(file);
    } finally {
      this.state.uploadInProgress = false;
    }
  }
}
