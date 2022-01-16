import _ from 'lodash-es';

export class VolumeBrowserController {
  /* @ngInject */
  constructor($async, HttpRequestHelper, VolumeBrowserService, FileSaver, Blob, ModalService, Notifications) {
    Object.assign(this, { $async, HttpRequestHelper, VolumeBrowserService, FileSaver, Blob, ModalService, Notifications });
    this.state = {
      path: '/',
    };

    this.rename = this.rename.bind(this);
    this.renameAsync = this.renameAsync.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.download = this.download.bind(this);
    this.downloadAsync = this.downloadAsync.bind(this);
    this.up = this.up.bind(this);
    this.browse = this.browse.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.deleteFileAsync = this.deleteFileAsync.bind(this);
    this.getFilesForPath = this.getFilesForPath.bind(this);
    this.getFilesForPathAsync = this.getFilesForPathAsync.bind(this);
    this.onFileSelectedForUpload = this.onFileSelectedForUpload.bind(this);
    this.onFileSelectedForUploadAsync = this.onFileSelectedForUploadAsync.bind(this);
    this.parentPath = this.parentPath.bind(this);
    this.buildPath = this.buildPath.bind(this);
    this.$onInit = this.$onInit.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    this.refreshList = this.refreshList.bind(this);
  }

  rename(file, newName) {
    return this.$async(this.renameAsync, file, newName);
  }
  async renameAsync(file, newName) {
    const filePath = this.state.path === '/' ? file : `${this.state.path}/${file}`;
    const newFilePath = this.state.path === '/' ? newName : `${this.state.path}/${newName}`;

    try {
      await this.VolumeBrowserService.rename(this.endpointId, this.volumeId, filePath, newFilePath);
      this.Notifications.success('File successfully renamed', newFilePath);
      this.files = await this.VolumeBrowserService.ls(this.endpointId, this.volumeId, this.state.path);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to rename file');
    }
  }

  confirmDelete(file) {
    const filePath = this.state.path === '/' ? file : `${this.state.path}/${file}`;

    this.ModalService.confirmDeletion(`Are you sure that you want to delete ${filePath} ?`, (confirmed) => {
      if (!confirmed) {
        return;
      }
      this.deleteFile(filePath);
    });
  }

  download(file) {
    return this.$async(this.downloadAsync, file);
  }
  async downloadAsync(file) {
    const filePath = this.state.path === '/' ? file : `${this.state.path}/${file}`;

    try {
      const data = await this.VolumeBrowserService.get(this.endpointId, this.volumeId, filePath);
      const downloadData = new Blob([data.file]);
      this.FileSaver.saveAs(downloadData, file);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to download file');
    }
  }

  up() {
    const parentFolder = this.parentPath(this.state.path);
    this.getFilesForPath(parentFolder);
  }

  browse(folder) {
    const path = this.buildPath(this.state.path, folder);
    this.getFilesForPath(path);
  }

  deleteFile(file) {
    return this.$async(this.deleteFileAsync, file);
  }
  async deleteFileAsync(file) {
    try {
      await this.VolumeBrowserService.delete(this.endpointId, this.volumeId, file);
      this.Notifications.success('File successfully deleted', file);
      this.files = await this.VolumeBrowserService.ls(this.endpointId, this.volumeId, this.state.path);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to delete file');
    }
  }

  getFilesForPath(path) {
    return this.$async(this.getFilesForPathAsync, path);
  }
  async getFilesForPathAsync(path) {
    try {
      const files = await this.VolumeBrowserService.ls(this.endpointId, this.volumeId, path);
      this.state.path = path;
      this.files = files;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to browse volume');
    }
  }

  onFileSelectedForUpload(file) {
    return this.$async(this.onFileSelectedForUploadAsync, file);
  }
  async onFileSelectedForUploadAsync(file) {
    try {
      await this.VolumeBrowserService.upload(this.endpointId, this.state.path, file, this.volumeId);
      this.onFileUploaded();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to upload file');
    }
  }

  parentPath(path) {
    if (path.lastIndexOf('/') === 0) {
      return '/';
    }

    const split = _.split(path, '/');
    return _.join(_.slice(split, 0, split.length - 1), '/');
  }

  buildPath(parent, file) {
    if (parent === '/') {
      return parent + file;
    }
    return `${parent}/${file}`;
  }

  onFileUploaded() {
    this.refreshList();
  }

  refreshList() {
    this.getFilesForPath(this.state.path);
  }

  async $onInit() {
    this.HttpRequestHelper.setPortainerAgentTargetHeader(this.nodeName);
    try {
      this.files = await this.VolumeBrowserService.ls(this.endpointId, this.volumeId, this.state.path);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to browse volume');
    }
  }
}
