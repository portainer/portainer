angular.module('portainer.agent').controller('HostBrowserController', [
  'HostBrowserService',
  'Notifications',
  'FileSaver',
  'ModalService',
  function HostBrowserController(
    HostBrowserService,
    Notifications,
    FileSaver,
    ModalService
  ) {
    var ctrl = this;
    ctrl.state = {
      path: '/'
    };

    ctrl.goToParent = goToParent;
    ctrl.browse = browse;
    ctrl.renameFile = renameFile;
    ctrl.downloadFile = downloadFile;
    ctrl.deleteFile = confirmDeleteFile;
    ctrl.isRoot = isRoot;
    ctrl.$onInit = $onInit;

    function goToParent() {
      getFilesForPath(parentPath(this.state.path));
    }

    function isRoot() {
      return ctrl.state.path === '/';
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
      var isRoot = ctrl.isRoot();
      var filePath = isRoot ? '/' + name : this.state.path + '/' + file;
      var newFilePath = isRoot
        ? '/' + newName
        : this.state.path + '/' + newName;

      HostBrowserService.rename(filePath, newFilePath)
        .then(function onRenameSuccess() {
          Notifications.success('File successfully renamed', newFilePath);
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
        'Are you sure that you want to delete ' + filePath + ' ?',
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
          Notifications.success('File successfully deleted', path);
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
      getFilesForPath('/');
    }

    function parentPath(path) {
      if (path.lastIndexOf('/') === 0) {
        return '/';
      }

      var split = _.split(path, '/');
      return _.join(_.slice(split, 0, split.length - 1), '/');
    }

    function buildPath(parent, file) {
      if (parent === '/') {
        return parent + file;
      }
      return parent + '/' + file;
    }
  }
]);
