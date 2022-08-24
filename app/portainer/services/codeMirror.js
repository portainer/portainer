import _ from 'lodash-es';
import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml.js';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/lint/yaml-lint.js';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/addon/search/search.js';
import 'codemirror/addon/search/searchcursor.js';
import 'codemirror/addon/search/jump-to-line.js';
import 'codemirror/addon/dialog/dialog.js';
import './codeMirrorDialog.css';

angular.module('portainer.app').factory('CodeMirrorService', function CodeMirrorService() {
  'use strict';

  var service = {};

  var codeMirrorGenericOptions = {
    lineNumbers: true,
    extraKeys: {
      'Alt-F': 'findPersistent',
    },
  };

  var codeMirrorYAMLOptions = {
    mode: 'text/x-yaml',
    gutters: ['CodeMirror-lint-markers'],
    lint: true,
    extraKeys: {
      'Alt-F': 'findPersistent',
      Tab: function (cm) {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      },
    },
  };

  service.applyCodeMirrorOnElement = function (element, yamlLint, readOnly) {
    var options = angular.copy(codeMirrorGenericOptions);

    if (yamlLint) {
      _.assign(options, codeMirrorYAMLOptions);
    }

    if (readOnly) {
      options.readOnly = true;
    }

    var cm = CodeMirror.fromTextArea(element, options);
    cm.setSize('100%', 500);
    return cm;
  };

  return service;
});
