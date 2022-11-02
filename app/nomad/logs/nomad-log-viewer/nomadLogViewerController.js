import { concatLogsToString, NEW_LINE_BREAKER } from '@/docker/helpers/logHelper';

/* @ngInject */
export default function NomadLogViewerController(clipboard, Blob, FileSaver) {
  this.NomadLogType = Object.freeze({
    STDERR: 'stderr',
    STDOUT: 'stdout',
  });

  this.state = {
    copySupported: clipboard.supported,
    logCollection: true,
    autoScroll: true,
    wrapLines: true,
    search: '',
    stderr: {
      filteredLogs: [],
      selectedLines: [],
    },
    stdout: {
      filteredLogs: [],
      selectedLines: [],
    },
  };

  this.model = {
    logType: this.NomadLogType.STDERR,
  };

  this.onChangeLogType = function (logType) {
    this.model.logType = this.NomadLogType[logType.toUpperCase()];
  };

  this.copy = function () {
    clipboard.copyText(this.state[this.model.logType].filteredLogs.map((log) => log.line).join(NEW_LINE_BREAKER));
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(2000);
  };

  this.copySelection = function () {
    clipboard.copyText(this.state[this.model.logType].selectedLines.join(NEW_LINE_BREAKER));
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(2000);
  };

  this.clearSelection = function () {
    this.state[this.model.logType].selectedLines = [];
  };

  this.selectLine = function (line) {
    var idx = this.state[this.model.logType].selectedLines.indexOf(line);
    if (idx === -1) {
      this.state[this.model.logType].selectedLines.push(line);
    } else {
      this.state[this.model.logType].selectedLines.splice(idx, 1);
    }
  };

  this.downloadLogs = function () {
    const logsAsString = concatLogsToString(this.state[this.model.logType].filteredLogs);
    const data = new Blob([logsAsString]);
    FileSaver.saveAs(data, this.resourceName + '_logs.txt');
  };
}
