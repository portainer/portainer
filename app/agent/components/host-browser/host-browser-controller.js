angular.module('portainer.agent').controller('HostBrowserController', [
  'HostBrowserService',
  'Notifications',
  'FileSaver',
  function HostBrowserController(HostBrowserService, Notifications, FileSaver) {
    var ctrl = this;
    ctrl.state = {
      path: '/'
    };

    ctrl.goToParent = goToParent;
    ctrl.browse = browse;
    ctrl.renameFile = renameFile;
    ctrl.downloadFile = downloadFile;
    ctrl.deleteFile = deleteFile;
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
      var filePath = ctrl.isRoot() ? file : this.state.path + '/' + file;
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

    function deleteFile(name) {}

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
