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
    const isBrowseEnabledOrig = this.isBrowseEnabled;
    this.isBrowseEnabled = false;

    await this.HostBrowserService.ls(this.environmentId, path);
    this.isBrowseEnabled = isBrowseEnabledOrig;
  }

  $onInit() {
    this.getFilesForPath(ROOT_PATH);
  }
}
