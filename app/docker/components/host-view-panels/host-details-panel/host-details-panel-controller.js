const ROOT_PATH = '/host';

export class HostDetailsPanelController {
  /* @ngInject */
  constructor($async, HostBrowserService) {
    Object.assign(this, { $async, HostBrowserService });

    this.getFilesForPath = this.getFilesForPath.bind(this);
    this.getFilesForPathAsync = this.getFilesForPathAsync.bind(this);
  }

  getFilesForPath(path) {
    return this.$async(this.getFilesForPathAsync, path);
  }

  async getFilesForPathAsync(path) {
    try {
      await this.HostBrowserService.ls(this.environmentId, path);
    } catch (err) {
      this.isBrowseEnabled = false;
    }
  }

  $onInit() {
    this.getFilesForPath(ROOT_PATH);
  }
}
