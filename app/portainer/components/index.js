import angular from 'angular';

import { react2Angular } from '@/react-tools/react2angular';
import sidebarModule from './sidebar';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import formComponentsModule from './form-components';

import { ReactExample } from './ReactExample';

export default angular
  .module('portainer.app.components', [sidebarModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('reactExample', react2Angular(ReactExample, ['text'])).name;
