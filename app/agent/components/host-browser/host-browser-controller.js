import _ from 'lodash-es';

angular.module('portainer.agent').controller('HostBrowserController', [
  'HostBrowserService', 'Notifications', 'FileSaver', 'ModalService',
  function HostBrowserController(HostBrowserService, Notifications, FileSaver, ModalService) {
    var ctrl = this;
    var ROOT_PATH = '/host';
    ctrl.state = {
      path: ROOT_PATH
    };

    ctrl.goToParent = goToParent;
    ctrl.browse = browse;
    ctrl.renameFile = renameFile;
    ctrl.downloadFile = downloadFile;
    ctrl.deleteFile = confirmDeleteFile;
    ctrl.isRoot = isRoot;
    ctrl.onFileSelectedForUpload = onFileSelectedForUpload;
    ctrl.$onInit = $onInit;
    ctrl.getRelativePath = getRelativePath;

    function getRelativePath(path) {
      path = path || ctrl.state.path;
      var rootPathRegex = new RegExp('^' + ROOT_PATH + '\/?');
      var relativePath = path.replace(rootPathRegex, '/');
      return relativePath;
    }

    function goToParent() {
      getFilesForPath(parentPath(this.state.path));
    }

    function isRoot() {
      return ctrl.state.path === ROOT_PATH;
    }

    function browse(folder) {
      getFilesForPath(buildPath(ctrl.state.path, folder));
    }

    function getFilesForPath(path) {
      HostBrowserService.ls(path)
        .then(function onFilesLoaded(files) {
          ctrl.state.path = path;
          ctrl.files = files;
        })
        .catch(function onLoadingFailed(err) {
          Notifications.error('Failure', err, 'Unable to browse');
        });
    }

    function renameFile(name, newName) {
      var filePath = buildPath(ctrl.state.path, name);
      var newFilePath = buildPath(ctrl.state.path, newName);

      HostBrowserService.rename(filePath, newFilePath)
        .then(function onRenameSuccess() {
          Notifications.success('File successfully renamed', getRelativePath(newFilePath));
          return HostBrowserService.ls(ctrl.state.path);
        })
        .then(function onFilesLoaded(files) {
          ctrl.files = files;
        })
        .catch(function notifyOnError(err) {
          Notifications.error('Failure', err, 'Unable to rename file');
        });
    }

    function downloadFile(file) {
      var filePath = buildPath(ctrl.state.path, file);
      HostBrowserService.get(filePath)
        .then(function onFileReceived(data) {
          var downloadData = new Blob([data.file], {
            type: 'text/plain;charset=utf-8'
          });
          FileSaver.saveAs(downloadData, file);
        })
        .catch(function notifyOnError(err) {
          Notifications.error('Failure', err, 'Unable to download file');
        });
    }

    function confirmDeleteFile(name) {
      var filePath = buildPath(ctrl.state.path, name);

      ModalService.confirmDeletion(
        'Are you sure that you want to delete ' + getRelativePath(filePath) + ' ?',
        function onConfirm(confirmed) {
          if (!confirmed) {
            return;
          }
          return deleteFile(filePath);
        }
      );
    }

    function deleteFile(path) {
      HostBrowserService.delete(path)
        .then(function onDeleteSuccess() {
          Notifications.success('File successfully deleted', getRelativePath(path));
          return HostBrowserService.ls(ctrl.state.path);
        })
        .then(function onFilesLoaded(data) {
          ctrl.files = data;
        })
        .catch(function notifyOnError(err) {
          Notifications.error('Failure', err, 'Unable to delete file');
        });
    }

    function $onInit() {
      getFilesForPath(ROOT_PATH);
    }

    function parentPath(path) {
      if (path === ROOT_PATH) {
        return ROOT_PATH;
      }

      var split = _.split(path, '/');
      return _.join(_.slice(split, 0, split.length - 1), '/');
    }

    function buildPath(parent, file) {
      if (parent.lastIndexOf('/') === parent.length - 1) {
        return parent + file;
      }
      return parent + '/' + file;
    }

    function onFileSelectedForUpload(file) {
      HostBrowserService.upload(ctrl.state.path, file)
        .then(function onFileUpload() {
          onFileUploaded();
        })
        .catch(function onFileUpload(err) {
          Notifications.error('Failure', err, 'Unable to upload file');
        });
    }

    function onFileUploaded() {
      refreshList();
    }

    function refreshList() {
      getFilesForPath(ctrl.state.path);
    }
  }
]);
