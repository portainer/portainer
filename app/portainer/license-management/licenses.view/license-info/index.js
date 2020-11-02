import controller from './license-info.controller.js';

export const licenseInfo = {
  templateUrl: './license-info.html',
  controller,
  bindings: { info: '<' },
};
