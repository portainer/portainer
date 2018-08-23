angular
  .module('portainer.agent')
  .controller('HostBrowserController', [function HostBrowserController() {

    this.isRoot=true
    this.files = []

    this.goToParent = goToParent;
    this.browse = browse;
    this.renameFile = renameFile;
    this.downloadFile = downloadFile;
    this.deleteFile = deleteFile;

    function goToParent() {

    }

    function browse(folderName) {

    } 

    function renameFile(name, newName) {

    }

    function downloadFile(name) {

    }

    function deleteFile(name) {

    }

  }]);
