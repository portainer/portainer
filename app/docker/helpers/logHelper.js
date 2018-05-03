angular.module('portainer.docker')
.factory('LogHelper', [function LogHelperFactory() {
  'use strict';
  var helper = {};

  // Return an array with each line being an entry.
  // It will also strip the 8 first characters of each line and remove any ANSI code related character sequences.
  helper.formatLogs = function(logs, skipHeaders) {
    if (skipHeaders) {
      logs = logs.substring(8);
      logs = logs.replace(/\n(.{8})/g, '\n\r');
      logs = logs.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    return logs.split('\n');
  };

  return helper;
}]);
