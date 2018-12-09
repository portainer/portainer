angular.module('portainer.docker')
.factory('LogHelper', [function LogHelperFactory() {
  'use strict';
  var helper = {};

  // Return an array with each line being an entry.
  // It will also remove any ANSI code related character sequences.
  // If the skipHeaders param is specified, it will strip the 8 first characters of each line.
  helper.formatLogs = function(logs, skipHeaders) {
    if (skipHeaders) {
      var lines = [];
      var pos = 8;
      while (pos < logs.length) {
        var end = logs.indexOf('\n', pos);
        if (end < 0)
          end = logs.length;
        lines.push(logs.substring(pos, end));
        pos = end + 1;
        pos += 8;
      }
      return lines;
    } else {
      logs = logs.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

      return logs.split('\n');
    }
  };

  return helper;
}]);
