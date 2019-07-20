import _ from 'lodash-es';

angular.module('portainer.agent')
.controller('VolumeBrowserController', ['HttpRequestHelper', 'VolumeBrowserService', 'FileSaver', 'Blob', 'ModalService', 'Notifications',
function (HttpRequestHelper, VolumeBrowserService, FileSaver, Blob, ModalService, Notifications) {
  var ctrl = this;

  this.state = {
    path: '/'
  };

  this.rename = function(file, newName) {
    var filePath = this.state.path === '/' ? file : this.state.path + '/' + file;
    var newFilePath = this.state.path === '/' ? newName : this.state.path + '/' + newName;

    VolumeBrowserService.rename(this.volumeId, filePath, newFilePath)
    .then(function success() {
      Notifications.success('File successfully renamed', newFilePath);
      return VolumeBrowserService.ls(ctrl.volumeId, ctrl.state.path);
    })
    .then(function success(data) {
      ctrl.files = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to rename file');
    });
  };

  this.delete = function(file) {
    var filePath = this.state.path === '/' ? file : this.state.path + '/' + file;

    ModalService.confirmDeletion(
      'Are you sure that you want to delete ' + filePath + ' ?',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteFile(filePath);
      }
    );
  };

  this.download = function(file) {
    var filePath = this.state.path === '/' ? file : this.state.path + '/' + file;
    VolumeBrowserService.get(this.volumeId, filePath)
    .then(function success(data) {
      var downloadData = new Blob([data.file]);
      FileSaver.saveAs(downloadData, file);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to download file');
    });
  };

  this.up = function() {
    var parentFolder = parentPath(this.state.path);
    browse(parentFolder);
  };

  this.browse = function(folder) {
    var path = buildPath(this.state.path, folder);
    browse(path);
  };

  function deleteFile(file) {
    VolumeBrowserService.delete(ctrl.volumeId, file)
    .then(function success() {
      Notifications.success('File successfully deleted', file);
      return VolumeBrowserService.ls(ctrl.volumeId, ctrl.state.path);
    })
    .then(function success(data) {
      ctrl.files = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to delete file');
    });
  }


  function browse(path) {
    VolumeBrowserService.ls(ctrl.volumeId, path)
    .then(function success(data) {
      ctrl.state.path = path;
      ctrl.files = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to browse volume');
    });
  }

  this.onFileSelectedForUpload = function onFileSelectedForUpload(file) {
    VolumeBrowserService.upload(ctrl.state.path, file, ctrl.volumeId)
      .then(function onFileUpload() {
        onFileUploaded();
      })
      .catch(function onFileUpload(err) {
        Notifications.error('Failure', err, 'Unable to upload file');
      });
  };

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


  this.$onInit = function() {
    HttpRequestHelper.setPortainerAgentTargetHeader(this.nodeName);
    VolumeBrowserService.ls(this.volumeId, this.state.path)
    .then(function success(data) {
      ctrl.files = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to browse volume');
    });
  };

  function onFileUploaded() {
    refreshList();
  }

  function refreshList() {
    browse(ctrl.state.path);
  }

  

}]);
