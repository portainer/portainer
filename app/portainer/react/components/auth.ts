import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { SetupTokenTextTip } from '@/react/portainer/init/InitAdminView/SetupTokenTextTip';

export const authModule = angular
  .module('portainer.app.react.components.auth', [])
  .component('setupTokenTextTip', r2a(SetupTokenTextTip, [])).name;
