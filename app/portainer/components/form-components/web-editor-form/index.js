import controller from './web-editor-form.controller.js';

export const webEditorForm = {
  templateUrl: './web-editor-form.html',
  controller,

  bindings: {
    identifier: '@',
    textTip: '@',
    yml: '<',
    value: '<',
    readOnly: '<',
    onChange: '<',
    hideTitle: '<',
    height: '@',
    schema: '<',
  },

  transclude: {
    description: '?editorDescription',
  },
};
