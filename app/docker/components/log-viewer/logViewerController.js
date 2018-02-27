angular.module('portainer.docker')
.controller('LogViewerController', ['clipboard',
function (clipboard) {
  var ctrl = this;

  this.state = {
    copySupported: clipboard.supported,
    logCollection: true,
    autoScroll: true,
    search: '',
    filteredLogs: [],
    selectedLines: []
  };

  this.copy = function() {
    clipboard.copyText(this.state.filteredLogs);
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(1500);
  };

  this.copySelection = function() {
    clipboard.copyText(this.state.selectedLines);
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(1500);
  };

  this.selectLine = function(line) {
    var idx = this.state.selectedLines.indexOf(line);
    if (idx === -1) {
      this.state.selectedLines.push(line);
    } else {
      this.state.selectedLines.splice(idx, 1);
    }
  };
}]);
