import _ from 'lodash-es';

const ROOT_PATH = '/host';

export class HostBrowserController {
  constructor(HostBrowserService, Notifications, FileSaver, ModalService) {
    Object.assign(this, { HostBrowserService, Notifications, FileSaver, ModalService });

    this.state = {
      path: ROOT_PATH,
    };

    this.goToParent = this.goToParent.bind(this);
    this.browse = this.browse.bind(this);
    this.renameFile = this.renameFile.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.confirmDeleteFile = this.confirmDeleteFile.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.isRoot = this.isRoot.bind(this);
    this.onFileSelectedForUpload = this.onFileSelectedForUpload.bind(this);
    this.getRelativePath = this.getRelativePath.bind(this);

    this.getFilesForPath = this.getFilesForPath.bind(this);
    // this.=this..bind(this)
  }

  getRelativePath(path) {
    path = path || this.state.path;
    var rootPathRegex = new RegExp('^' + ROOT_PATH + '/?');
    var relativePath = path.replace(rootPathRegex, '/');
    return relativePath;
  }

  goToParent() {
    this.getFilesForPath(this.parentPath(this.state.path));
  }

  isRoot() {
    return this.state.path === ROOT_PATH;
  }

  browse(folder) {
    this.getFilesForPath(this.buildPath(this.state.path, folder));
  }

  getFilesForPath(path) {
    this.HostBrowserService.ls(path)
      .then((files) => {
        this.state.path = path;
        this.files = files;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to browse');
      });
  }

  renameFile(name, newName) {
    var filePath = this.buildPath(this.state.path, name);
    var newFilePath = this.buildPath(this.state.path, newName);

    this.HostBrowserService.rename(filePath, newFilePath)
      .then(() => {
        this.Notifications.success('File successfully renamed', this.getRelativePath(newFilePath));
        return this.HostBrowserService.ls(this.state.path);
      })
      .then((files) => {
        this.files = files;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to rename file');
      });
  }

  downloadFile(file) {
    var filePath = this.buildPath(this.state.path, file);
    this.HostBrowserService.get(filePath)
      .then((data) => {
        var downloadData = new Blob([data.file], {
          type: 'text/plain;charset=utf-8',
        });
        this.FileSaver.saveAs(downloadData, file);
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to download file');
      });
  }

  confirmDeleteFile(name) {
    var filePath = this.buildPath(this.state.path, name);

    this.ModalService.confirmDeletion('Are you sure that you want to delete ' + this.getRelativePath(filePath) + ' ?', (confirmed) => {
      if (!confirmed) {
        return;
      }
      return this.deleteFile(filePath);
    });
  }

  deleteFile(path) {
    this.HostBrowserService.delete(path)
      .then(() => {
        this.Notifications.success('File successfully deleted', this.getRelativePath(path));
        return this.HostBrowserService.ls(this.state.path);
      })
      .then((data) => {
        this.files = data;
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to delete file');
      });
  }

  $onInit() {
    this.getFilesForPath(ROOT_PATH);
  }

  parentPath(path) {
    if (path === ROOT_PATH) {
      return ROOT_PATH;
    }

    var split = _.split(path, '/');
    return _.join(_.slice(split, 0, split.length - 1), '/');
  }

  buildPath(parent, file) {
    if (parent.lastIndexOf('/') === parent.length - 1) {
      return parent + file;
    }
    return parent + '/' + file;
  }

  onFileSelectedForUpload(file) {
    this.HostBrowserService.upload(this.state.path, file)
      .then(() => {
        this.onFileUploaded();
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to upload file');
      });
  }

  onFileUploaded() {
    this.refreshList();
  }

  refreshList() {
    this.getFilesForPath(this.state.path);
  }
}
