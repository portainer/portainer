angular.module('portainer.docker').factory('LabelHelper', [
  function LabelHelperFactory() {
    'use strict';
    return {
      fromLabelHashToKeyValue: function (labels) {
        if (labels) {
          return Object.keys(labels).map(function (key) {
            return { key: key, value: labels[key], originalKey: key, originalValue: labels[key], added: true };
          });
        }
        return [];
      },
      fromKeyValueToLabelHash: function (labelKV) {
        var labels = {};
        if (labelKV) {
          labelKV.forEach(function (label) {
            if (label.key) {
              labels[label.key] = label.value;
            }
          });
        }
        return labels;
      },
    };
  },
]);
