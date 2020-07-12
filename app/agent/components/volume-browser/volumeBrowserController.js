import _ from 'lodash-es';

export class VolumeBrowserController {
  constructor(HttpRequestHelper, VolumeBrowserService, FileSaver, Blob, ModalService, Notifications) {
    Object.assign(this, { HttpRequestHelper, VolumeBrowserService, FileSaver, Blob, ModalService, Notifications });
    this.state = {
      path: '/',
    };

    // this. = this..bind(this)
    this.rename = this.rename.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.download = this.download.bind(this);
    this.up = this.up.bind(this);
    this.browse = this.browse.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.getFilesForPath = this.getFilesForPath.bind(this);
    this.onFileSelectedForUpload = this.onFileSelectedForUpload.bind(this);
    this.parentPath = this.parentPath.bind(this);
    this.buildPath = this.buildPath.bind(this);
    this.$onInit = this.$onInit.bind(this);
    this.onFileUploaded = this.onFileUploaded.bind(this);
    this.refreshList = this.refreshList.bind(this);
  }

  rename(file, newName) {
    const filePath = this.state.path === '/' ? file : this.state.path + '/' + file;
    const newFilePath = this.state.path === '/' ? newName : this.state.path + '/' + newName;

    this.VolumeBrowserService.rename(this.volumeId, filePath, newFilePath)
      .then(() => {
        this.Notifications.success('File successfully renamed', newFilePath);
        return this.VolumeBrowserService.ls(this.volumeId, this.state.path);
      })
      .then((data) => {
        this.files = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to rename file');
      });
  }

  confirmDelete(file) {
    const filePath = this.state.path === '/' ? file : this.state.path + '/' + file;

    this.ModalService.confirmDeletion('Are you sure that you want to delete ' + filePath + ' ?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      this.deleteFile(filePath);
    });
  }

  download(file) {
    const filePath = this.state.path === '/' ? file : this.state.path + '/' + file;
    this.VolumeBrowserService.get(this.volumeId, filePath)
      .then((data) => {
        const downloadData = new Blob([data.file]);
        this.FileSaver.saveAs(downloadData, file);
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to download file');
      });
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
    this.VolumeBrowserService.delete(this.volumeId, file)
      .then(() => {
        this.Notifications.success('File successfully deleted', file);
        return this.VolumeBrowserService.ls(this.volumeId, this.state.path);
      })
      .then((data) => {
        this.files = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to delete file');
      });
  }

  getFilesForPath(path) {
    this.VolumeBrowserService.ls(this.volumeId, path)
      .then((data) => {
        this.state.path = path;
        this.files = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to browse volume');
      });
  }

  onFileSelectedForUpload(file) {
    this.VolumeBrowserService.upload(this.state.path, file, this.volumeId)
      .then(() => {
        this.onFileUploaded();
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to upload file');
      });
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
    return parent + '/' + file;
  }

  $onInit() {
    this.HttpRequestHelper.setPortainerAgentTargetHeader(this.nodeName);
    this.VolumeBrowserService.ls(this.volumeId, this.state.path)
      .then((data) => {
        this.files = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to browse volume');
      });
  }

  onFileUploaded() {
    this.refreshList();
  }

  refreshList() {
    this.getFilesForPath(this.state.path);
  }
}
