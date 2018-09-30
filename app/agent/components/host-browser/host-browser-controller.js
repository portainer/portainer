angular.module('portainer.agent').controller('HostBrowserController', [
  'HostBrowserService',
  'Notifications',
  function HostBrowserController(HostBrowserService, Notifications) {
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

    function renameFile(name, newName) {}

    function downloadFile(name) {}

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
