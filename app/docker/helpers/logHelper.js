import angular from 'angular';

angular.module('portainer.docker')
.factory('LogHelper', [function LogHelperFactory() {
  'use strict';
  var helper = {};

  // Return an array with each line being an entry.
  // It will also remove any ANSI code related character sequences.
  // If the skipHeaders param is specified, it will strip the 8 first characters of each line.
  helper.formatLogs = function(logs, skipHeaders) {
    logs = logs.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

    if (skipHeaders) {
      logs = logs.substring(8);
      logs = logs.replace(/\n(.{8})/g, '\n\r');
    }

    return logs.split('\n');
  };

  return helper;
}]);
