import controller from './license-item.controller';

export const licenseFormItem = {
  bindings: {
    keyValidation: '<',
    value: '<',
    index: '<',

    onChange: '&',
    onRemoveClick: '&',
  },
  controller,
  templateUrl: './license-item.html',
};
